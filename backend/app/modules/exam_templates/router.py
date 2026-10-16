from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.school_access import check_school_access
from app.db.database import get_db
from app.models.exam_template import ExamTemplate
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.services.storage import upload_file

router = APIRouter(prefix="/exam-templates", tags=["School Exam Templates"])

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}
ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
MAX_FILE_SIZE = 20 * 1024 * 1024


def _role(user: User) -> str:
    return (user.role.name if user.role and user.role.name else "").strip().upper()


def _school_id(user: User, requested_school_id: int | None) -> int:
    if _role(user) == "SUPER_ADMIN":
        if not requested_school_id:
            raise HTTPException(
                status_code=400,
                detail="school_id is required for Super Admin requests.",
            )
        target = requested_school_id
    else:
        target = user.school_id
        if requested_school_id is not None and requested_school_id != target:
            raise HTTPException(
                status_code=403,
                detail="You can only access templates belonging to your school.",
            )

    check_school_access(user, target)
    return target


def _require_manager(user: User) -> None:
    if _role(user) not in {"SUPER_ADMIN", "SCHOOL_ADMIN"}:
        raise HTTPException(
            status_code=403,
            detail="Only school administrators can manage examination templates.",
        )


def _serialize(item: ExamTemplate) -> dict:
    return {
        "id": item.id,
        "school_id": item.school_id,
        "title": item.title,
        "assessment_type": item.assessment_type,
        "description": item.description,
        "class_name": item.class_name,
        "subject": item.subject,
        "file_url": item.file_url,
        "original_filename": item.original_filename,
        "content_type": item.content_type,
        "file_size": item.file_size,
        "version": item.version,
        "is_active": item.is_active,
        "uploaded_by": item.uploaded_by,
        "created_at": item.created_at.isoformat() if item.created_at else None,
    }


@router.get("")
async def list_templates(
    school_id: int | None = Query(None),
    include_archived: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    target_school = _school_id(user, school_id)
    manager = _role(user) in {"SUPER_ADMIN", "SCHOOL_ADMIN"}

    if include_archived and not manager:
        raise HTTPException(
            status_code=403,
            detail="Only administrators can view archived template versions.",
        )

    query = select(ExamTemplate).where(
        ExamTemplate.school_id == target_school
    )
    if not include_archived:
        query = query.where(ExamTemplate.is_active.is_(True))

    query = query.order_by(
        ExamTemplate.title.asc(),
        ExamTemplate.version.desc(),
    )
    result = await db.execute(query)
    return [_serialize(item) for item in result.scalars().all()]


@router.post("")
async def create_template(
    title: str = Form(...),
    assessment_type: str = Form(...),
    description: str | None = Form(None),
    class_name: str | None = Form(None),
    subject: str | None = Form(None),
    school_id: int | None = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _require_manager(user)
    target_school = _school_id(user, school_id)

    title = title.strip()
    assessment_type = assessment_type.strip().upper()
    if not title or len(title) > 200:
        raise HTTPException(status_code=400, detail="Enter a valid template title.")
    if assessment_type not in {"EXAM", "TEST", "QUIZ"}:
        raise HTTPException(
            status_code=400,
            detail="Assessment type must be EXAM, TEST or QUIZ.",
        )

    filename = Path(file.filename or "").name
    extension = Path(filename).suffix.lower()
    content_type = (file.content_type or "").lower()

    if extension not in ALLOWED_EXTENSIONS or content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, DOC and DOCX template files are allowed.",
        )

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Maximum template size is 20 MB.")
    await file.seek(0)

    previous_result = await db.execute(
        select(ExamTemplate).where(
            ExamTemplate.school_id == target_school,
            ExamTemplate.title == title,
        )
    )
    previous_versions = previous_result.scalars().all()
    next_version = max((item.version for item in previous_versions), default=0) + 1

    # Upload first. Keep the old version intact if Cloudinary rejects the file.
    upload_result = await upload_file(
        file,
        folder=f"coreone/schools/{target_school}/exam-templates",
        resource_type="raw",
    )
    file_url = upload_result.get("secure_url")
    public_id = upload_result.get("public_id")

    if not file_url or not public_id:
        raise HTTPException(
            status_code=502,
            detail="Cloudinary did not return the uploaded file details.",
        )

    # A new version becomes current; previous versions remain in the database.
    for previous in previous_versions:
        previous.is_active = False

    item = ExamTemplate(
        school_id=target_school,
        title=title,
        assessment_type=assessment_type,
        description=description.strip() if description else None,
        class_name=class_name.strip() if class_name else None,
        subject=subject.strip() if subject else None,
        file_url=file_url,
        cloudinary_public_id=public_id,
        original_filename=filename,
        content_type=content_type,
        file_size=len(content),
        version=next_version,
        is_active=True,
        uploaded_by=user.id,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return _serialize(item)


@router.post("/{template_id}/archive")
async def archive_template(
    template_id: int,
    school_id: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _require_manager(user)
    target_school = _school_id(user, school_id)

    result = await db.execute(
        select(ExamTemplate).where(
            ExamTemplate.id == template_id,
            ExamTemplate.school_id == target_school,
        )
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=404, detail="Template not found.")

    item.is_active = False
    await db.commit()
    return {"message": "Template archived.", "id": item.id}
