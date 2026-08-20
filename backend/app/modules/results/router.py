from fastapi import APIRouter, Depends, status, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db

from app.core.tenant.context import TenantContext
from app.core.tenant.dependencies import get_tenant_from_request

from app.models.user import User
from app.models.classroom import Classroom
from app.models.result import Result
from app.modules.auth.dependencies.current_user import get_current_user

from app.modules.results.schemas import (
    ResultCreateRequest,
    ResultUpdateRequest,
    BulkResultEntryRequest,
    ResultCommentRequest,
)

from app.modules.results.service import ResultService


router = APIRouter(
    prefix="/results",
    tags=["Results"],
)


# =========================================================
# COLLECTION / READ
# =========================================================

@router.get("", status_code=status.HTTP_200_OK)
async def get_results(
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    return await ResultService(db).get_results(
        current_user=current_user,
        tenant=tenant,
    )


@router.get("/teacher", status_code=status.HTTP_200_OK)
async def get_teacher_results(
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    return await ResultService(db).get_teacher_results(
        current_user,
        tenant,
    )


@router.get(
    "/student/{student_id}/report",
    status_code=status.HTTP_200_OK,
)
async def student_report(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    return await ResultService(db).get_student_report(
        student_id,
        current_user,
        tenant,
    )


@router.get(
    "/student/{student_id}/pdf",
    status_code=status.HTTP_200_OK,
)
async def student_report_pdf(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    pdf = await ResultService(db).generate_student_report_pdf(
        student_id,
        current_user,
        tenant,
    )

    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                "attachment; filename=student_report_card.pdf"
            )
        },
    )


# =========================================================
# CREATE / BULK
# =========================================================

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
async def create_result(
    payload: ResultCreateRequest,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    return await ResultService(db).create_result(
        payload,
        current_user,
        tenant,
    )


@router.post(
    "/bulk-entry",
    status_code=status.HTTP_200_OK,
)
async def bulk_entry(
    payload: BulkResultEntryRequest,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    return await ResultService(db).create_bulk_results(
        payload,
        current_user,
        tenant,
    )


# =========================================================
# DELETE ALL
# =========================================================

@router.delete(
    "",
    status_code=status.HTTP_200_OK,
)
async def delete_all_results(
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    return await ResultService(db).delete_all_results(
        current_user,
        tenant,
    )


# =========================================================
# SINGLE RESULT
# =========================================================

@router.get(
    "/{result_id}",
    status_code=status.HTTP_200_OK,
)
async def get_result(
    result_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    return await ResultService(db).get_result(
        result_id,
        current_user,
        tenant,
    )


@router.put(
    "/{result_id}",
    status_code=status.HTTP_200_OK,
)
async def update_result(
    result_id: int,
    payload: ResultUpdateRequest,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    return await ResultService(db).update_result(
        result_id,
        payload,
        current_user,
        tenant,
    )


@router.patch(
    "/{result_id}/comment",
    status_code=status.HTTP_200_OK,
)
async def add_result_comment(
    result_id: int,
    payload: ResultCommentRequest,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    return await ResultService(db).add_comment(
        result_id,
        payload,
        current_user,
        tenant,
    )


@router.delete(
    "/{result_id}",
    status_code=status.HTTP_200_OK,
)
async def delete_result(
    result_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    return await ResultService(db).delete_result(
        result_id,
        current_user,
        tenant,
    )

# ============================================================
# COREONE OFFICIAL RESULT COMMENTS
# ============================================================

@router.patch("/{result_id}/teacher-comment")
async def update_teacher_comment(
    result_id: int,
    payload: dict,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Subject-level teacher comments are no longer part of the
    CoreOne report-card workflow.

    The official teacher-side report comment is now the single
    class-teacher comment per student.
    """
    raise HTTPException(
        status_code=410,
        detail=(
            "Subject-level teacher comments are no longer used. "
            "The assigned class teacher enters one report-level "
            "comment per student."
        ),
    )


@router.patch("/student/{student_id}/class-teacher-comment")
async def update_student_class_teacher_comment(
    student_id: int,
    payload: dict,
    current_user=Depends(get_current_user),
    tenant: TenantContext = Depends(get_tenant_from_request),
    db: AsyncSession = Depends(get_db),
):
    """
    ONE report-level comment written by the assigned class teacher
    for the complete student report card.
    """

    role_name = (
        getattr(
            getattr(current_user, "role", None),
            "name",
            None,
        )
        or getattr(current_user, "role", None)
        or ""
    )
    role_name = str(role_name).upper()

    if role_name != "TEACHER":
        raise HTTPException(
            status_code=403,
            detail="Only a teacher can enter the class-teacher report comment.",
        )

    teacher = getattr(
        current_user,
        "teacher",
        None,
    )

    if teacher is None:
        from app.models.teacher import Teacher

        teacher_result = await db.execute(
            select(Teacher).where(
                Teacher.user_id == current_user.id,
                Teacher.school_id == tenant.school_id,
            )
        )
        teacher = teacher_result.scalar_one_or_none()

    if teacher is None:
        raise HTTPException(
            status_code=403,
            detail="Teacher profile not found.",
        )

    student_result = await db.execute(
        select(
            Result,
            Classroom.class_teacher_id,
        )
        .join(
            Classroom,
            Classroom.id == Result.class_id,
        )
        .where(
            Result.student_id == student_id,
            Result.school_id == tenant.school_id,
            Result.is_active == True,
        )
        .order_by(Result.id.asc())
    )

    rows = student_result.all()

    if not rows:
        raise HTTPException(
            status_code=404,
            detail="No result records were found for this student.",
        )

    anchor = rows[0][0]
    assigned_class_teacher_id = rows[0][1]

    if assigned_class_teacher_id != teacher.id:
        raise HTTPException(
            status_code=403,
            detail=(
                "You are not the assigned class teacher for "
                "this student's class."
            ),
        )

    from app.modules.results.service import (
        save_class_teacher_result_comment,
    )

    try:
        await save_class_teacher_result_comment(
            anchor,
            payload.get("comment"),
            teacher.id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    await db.commit()
    await db.refresh(anchor)

    return {
        "message": (
            "Class teacher report comment saved successfully."
        ),
        "student_id": student_id,
        "class_teacher_comment":
            anchor.class_teacher_comment,
        "is_published":
            getattr(anchor, "is_published", False),
    }


@router.patch("/student/{student_id}/principal-comment")
async def update_student_principal_comment(
    student_id: int,
    payload: dict,
    current_user=Depends(get_current_user),
    tenant: TenantContext = Depends(get_tenant_from_request),
    db: AsyncSession = Depends(get_db),
):
    """
    REPORT-CARD-LEVEL PRINCIPAL COMMENT

    ONE principal/head comment belongs to the COMPLETE student report card.

    It is stored on the report's anchor result for compatibility with the
    current schema, but it is NOT a subject comment.
    """

    role_name = (
        getattr(getattr(current_user, "role", None), "name", None)
        or getattr(current_user, "role", None)
        or ""
    )
    role_name = str(role_name).upper()

    if role_name not in {"SCHOOL_ADMIN", "PRINCIPAL", "SUPER_ADMIN"}:
        raise HTTPException(
            status_code=403,
            detail="Only the School Administrator or Principal can enter the report-card principal comment.",
        )

    query = await db.execute(
        select(Result)
        .where(
            Result.student_id == student_id,
            Result.school_id == tenant.school_id,
            Result.is_active == True,
        )
        .order_by(Result.id.asc())
    )

    rows = query.scalars().all()

    if not rows:
        raise HTTPException(
            status_code=404,
            detail="No result records were found for this student.",
        )

    anchor = rows[0]

    from app.modules.results.service import save_principal_result_comment

    comment = payload.get("comment")

    try:
        await save_principal_result_comment(
            anchor,
            comment,
            getattr(current_user, "id", None),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    # One principal comment controls the complete report card.
    for row in rows:
        if hasattr(row, "is_published"):
            row.is_published = False
        if hasattr(row, "published_at"):
            row.published_at = None
        if hasattr(row, "published_by"):
            row.published_by = None
        if hasattr(row, "status"):
            row.status = "REVIEW"

    await db.commit()
    await db.refresh(anchor)

    return {
        "message": "Principal report-card comment saved successfully.",
        "student_id": student_id,
        "principal_comment": anchor.principal_comment,
        "is_published": False,
    }


@router.post("/{result_id}/publish")
async def publish_result(
    result_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    PRINCIPAL / SCHOOL ADMIN ONLY

    Final publication gate.

    Teacher comment MUST exist.
    Principal comment MUST exist.
    """

    from app.modules.results.service import (
        publish_result_after_comment_validation,
    )

    result = await db.get(Result, result_id)

    if not result:
        raise HTTPException(status_code=404, detail="Result not found")

    role = str(
        getattr(current_user, "role", "")
    ).upper()

    if role not in {"SCHOOL_ADMIN", "SUPER_ADMIN", "PRINCIPAL"}:
        raise HTTPException(
            status_code=403,
            detail="Only the Principal or authorized School Administrator can publish results.",
        )

    try:
        await publish_result_after_comment_validation(result)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    await db.commit()
    await db.refresh(result)

    return {
        "message": "Result published successfully.",
        "result_id": result.id,
        "is_published": result.is_published,
        "published_at": result.published_at,
    }


@router.post("/{result_id}/unpublish")
async def unpublish_result(
    result_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    PRINCIPAL / SCHOOL ADMIN ONLY

    Allows an authorized administrator to return a published
    result to review status.
    """

    result = await db.get(Result, result_id)

    if not result:
        raise HTTPException(status_code=404, detail="Result not found")

    role = str(
        getattr(current_user, "role", "")
    ).upper()

    if role not in {"SCHOOL_ADMIN", "SUPER_ADMIN", "PRINCIPAL"}:
        raise HTTPException(
            status_code=403,
            detail="Only the Principal or authorized School Administrator can unpublish results.",
        )

    if hasattr(result, "is_published"):
        result.is_published = False

    if hasattr(result, "published_at"):
        result.published_at = None

    await db.commit()
    await db.refresh(result)

    return {
        "message": "Result returned to review.",
        "result_id": result.id,
        "is_published": False,
    }




# ============================================================
# COMPLETE REPORT CARD PUBLISH / UNPUBLISH
# ============================================================

@router.post("/publish-selected")
async def publish_selected_report_cards(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    """
    CENTRAL SCHOOL-ADMIN REPORT CARD PUBLISHING.

    Publishes complete report cards for explicitly selected students.
    """

    role_name = (
        getattr(
            getattr(current_user, "role", None),
            "name",
            None,
        )
        or getattr(current_user, "role", None)
        or ""
    )
    role_name = str(role_name).upper()

    if role_name not in {
        "SUPER_ADMIN",
        "SCHOOL_ADMIN",
    }:
        raise HTTPException(
            status_code=403,
            detail="Only the School Administrator can publish report cards.",
        )

    raw_student_ids = payload.get("student_ids") or []
    class_id = payload.get("class_id")
    term_id = payload.get("term_id")
    academic_session_id = payload.get("academic_session_id")

    if not term_id or not academic_session_id:
        raise HTTPException(
            status_code=400,
            detail="term_id and academic_session_id are required.",
        )

    try:
        term_id = int(term_id)
        academic_session_id = int(academic_session_id)
        if term_id <= 0 or academic_session_id <= 0:
            raise ValueError
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="term_id and academic_session_id must be valid IDs.",
        )

    try:
        student_ids = sorted(
            {
                int(value)
                for value in raw_student_ids
                if int(value) > 0
            }
        )
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="student_ids must contain valid student IDs.",
        )

    if not student_ids:
        raise HTTPException(
            status_code=400,
            detail="Select at least one student to publish.",
        )

    query = await db.execute(
        select(Result)
        .where(
            Result.student_id.in_(student_ids),
            Result.school_id == tenant.school_id,
            Result.term_id == term_id,
            Result.academic_session_id == academic_session_id,
            Result.is_active == True,
        )
        .order_by(
            Result.student_id.asc(),
            Result.id.asc(),
        )
    )

    rows = query.scalars().all()

    grouped = {}

    for row in rows:
        grouped.setdefault(
            row.student_id,
            [],
        ).append(row)

    missing_students = [
        student_id
        for student_id in student_ids
        if student_id not in grouped
    ]

    if missing_students:
        raise HTTPException(
            status_code=404,
            detail=(
                "No result records were found for student IDs: "
                + ", ".join(str(value) for value in missing_students)
            ),
        )

    from app.models.teacher_subject import TeacherSubject

    publication_errors = []

    for student_id in student_ids:
        student_rows = grouped[student_id]
        anchor = student_rows[0]

        if class_id is None:
            publication_errors.append(
                f"Student {student_id}: class_id is required."
            )
            continue

        try:
            requested_class_id = int(class_id)
        except (TypeError, ValueError):
            publication_errors.append(
                f"Student {student_id}: selected class is invalid."
            )
            continue

        if requested_class_id != int(anchor.class_id):
            publication_errors.append(
                f"Student {student_id} does not belong to the selected class."
            )
            continue

        if int(anchor.term_id) != term_id:
            publication_errors.append(
                f"Student {student_id}: result term does not match the selected term."
            )
            continue

        if int(anchor.academic_session_id) != academic_session_id:
            publication_errors.append(
                f"Student {student_id}: result session does not match the selected session."
            )
            continue

        if not (anchor.class_teacher_comment or "").strip():
            publication_errors.append(
                f"Student {student_id}: class-teacher comment is missing."
            )

        if not (anchor.principal_comment or "").strip():
            publication_errors.append(
                f"Student {student_id}: principal comment is missing."
            )

        assignment_result = await db.execute(
            select(TeacherSubject.subject_id).where(
                TeacherSubject.classroom_id == anchor.class_id,
                TeacherSubject.school_id == tenant.school_id,
                TeacherSubject.academic_session_id
                == anchor.academic_session_id,
                TeacherSubject.is_active == True,
            )
        )

        expected_subject_ids = {
            value[0]
            for value in assignment_result.all()
            if value[0] is not None
        }

        actual_subject_ids = {
            row.subject_id
            for row in student_rows
        }

        missing_subjects = (
            expected_subject_ids - actual_subject_ids
        )

        if missing_subjects:
            publication_errors.append(
                f"Student {student_id}: one or more subject results "
                "have not been entered yet."
            )

    if publication_errors:
        raise HTTPException(
            status_code=400,
            detail=publication_errors,
        )

    from datetime import datetime, timezone

    now = datetime.now(timezone.utc)

    published_count = 0

    for student_id in student_ids:
        for result in grouped[student_id]:
            result.is_published = True
            result.published_at = now
            result.published_by = current_user.id
            result.status = "PUBLISHED"
            published_count += 1

    await db.commit()

    return {
        "message": "Selected report cards published successfully.",
        "student_ids": student_ids,
        "student_count": len(student_ids),
        "published_result_count": published_count,
        "class_id": int(class_id),
        "term_id": term_id,
        "academic_session_id": academic_session_id,
        "is_published": True,
        "published_at": now,
    }


@router.post("/student/{student_id}/publish")
async def publish_student_report_card(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    role_name = (
        getattr(getattr(current_user, "role", None), "name", None)
        or getattr(current_user, "role", None)
        or ""
    )
    role_name = str(role_name).upper()

    if role_name not in {"SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"}:
        raise HTTPException(
            status_code=403,
            detail="Only school administration can publish report cards.",
        )

    query = await db.execute(
        select(Result)
        .where(
            Result.student_id == student_id,
            Result.school_id == tenant.school_id,
            Result.is_active == True,
        )
        .order_by(Result.id.asc())
    )

    rows = query.scalars().all()

    if not rows:
        raise HTTPException(
            status_code=404,
            detail="No result records were found for this student.",
        )

    # ONE class-teacher comment for the COMPLETE report card.
    anchor = rows[0]

    if not (anchor.class_teacher_comment or "").strip():
        raise HTTPException(
            status_code=400,
            detail=(
                "The class-teacher report comment is missing. "
                "The report card cannot be published yet."
            ),
        )

    # ONE principal comment for the COMPLETE report card.
    if not (anchor.principal_comment or "").strip():
        raise HTTPException(
            status_code=400,
            detail=(
                "The principal/head report-card comment is missing. "
                "The report card cannot be published yet."
            ),
        )

    from datetime import datetime, timezone

    now = datetime.now(timezone.utc)

    for result in rows:
        result.is_published = True
        result.published_at = now
        result.published_by = current_user.id
        result.status = "PUBLISHED"

    await db.commit()

    return {
        "message": "Student report card published successfully.",
        "student_id": student_id,
        "published_count": len(rows),
        "is_published": True,
        "published_at": now,
    }


@router.post("/student/{student_id}/unpublish")
async def unpublish_student_report_card(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    role_name = (
        getattr(getattr(current_user, "role", None), "name", None)
        or getattr(current_user, "role", None)
        or ""
    )
    role_name = str(role_name).upper()

    if role_name not in {"SUPER_ADMIN", "SCHOOL_ADMIN"}:
        raise HTTPException(
            status_code=403,
            detail="Only school administration can unpublish report cards.",
        )

    query = select(Result).where(
        Result.student_id == student_id,
        Result.school_id == tenant.school_id,
        Result.is_active == True,
    )

    rows = (await db.execute(query)).scalars().all()

    if not rows:
        raise HTTPException(
            status_code=404,
            detail="No result records were found for this student.",
        )

    for result in rows:
        result.is_published = False
        result.published_at = None
        result.status = "REVIEW"

    await db.commit()

    return {
        "message": "Student report card unpublished successfully.",
        "student_id": student_id,
        "unpublished_count": len(rows),
        "is_published": False,
    }
