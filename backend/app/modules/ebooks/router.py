from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.models.ebook_activity import EbookActivity
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.ebooks.schemas import (
    EbookCreateRequest,
    EbookResponse,
    EbookUpdateRequest,
)
from app.modules.ebooks.service import EbookService

router = APIRouter(
    prefix="/ebooks",
    tags=["Ebooks"],
)


@router.get(
    "",
    response_model=list[EbookResponse],
)
async def list_ebooks(
    search: str | None = Query(None),
    category: str | None = Query(None),
    subject_id: int | None = Query(None),
    classroom_id: int | None = Query(None),
    featured: bool | None = Query(None),
    include_archived: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await EbookService(db).list_ebooks(
        school_id=current_user.school_id,
        search=search,
        category=category,
        subject_id=subject_id,
        classroom_id=classroom_id,
        featured=featured,
        include_archived=include_archived,
    )


@router.get(
    "/recent",
    response_model=list[EbookResponse],
)
async def recent_ebooks(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await EbookService(db).recent_ebooks(
        current_user.school_id,
        limit,
    )


@router.get(
    "/categories",
    response_model=list[str],
)
async def ebook_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await EbookService(db).categories(
        current_user.school_id
    )


@router.get(
    "/{ebook_id}",
    response_model=EbookResponse,
)
async def get_ebook(
    ebook_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await EbookService(db).get_ebook(
        ebook_id,
        current_user.school_id,
    )


@router.post(
    "",
    response_model=EbookResponse,
)
async def create_ebook(
    payload: EbookCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await EbookService(db).create_ebook(
        payload,
        current_user,
    )


@router.patch(
    "/{ebook_id}",
    response_model=EbookResponse,
)
async def update_ebook(
    ebook_id: int,
    payload: EbookUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await EbookService(db).update_ebook(
        ebook_id,
        payload,
        current_user,
    )


@router.delete(
    "/{ebook_id}",
)
async def delete_ebook(
    ebook_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Archive the ebook instead of permanently deleting it.
    """
    ebook = await EbookService(db).get_ebook(
        ebook_id,
        current_user.school_id,
    )

    if not ebook:
        raise HTTPException(
            status_code=404,
            detail="Ebook not found",
        )

    ebook.is_active = False

    await db.commit()
    await db.refresh(ebook)

    return {
        "message": "Ebook archived successfully",
        "id": ebook.id,
        "is_active": ebook.is_active,
    }



@router.get("/{ebook_id}/file")
async def protected_ebook_file(
    ebook_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Protected ebook file.

    Files are stored in:
        protected_ebooks/{school_id}/files/

    The client must be authenticated and belong to
    the same school as the ebook.
    """

    ebook = await EbookService(db).get_ebook(
        ebook_id,
        current_user.school_id,
    )

    if not ebook:
        raise HTTPException(
            status_code=404,
            detail="Ebook not found.",
        )

    if not ebook.file_url:
        raise HTTPException(
            status_code=404,
            detail="Ebook file not available.",
        )

    filename = Path(
        ebook.file_url.split("?")[0]
    ).name

    protected_root = (
        Path.cwd()
        / "protected_ebooks"
        / str(current_user.school_id)
        / "files"
    ).resolve()

    file_path = (
        protected_root / filename
    ).resolve()

    try:
        file_path.relative_to(protected_root)
    except ValueError:
        raise HTTPException(
            status_code=403,
            detail="Invalid ebook path.",
        )

    if not file_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Ebook file not found.",
        )

    return FileResponse(
        path=str(file_path),
        media_type=ebook.file_type or "application/pdf",
        filename=ebook.file_name or filename,
        headers={
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
        },
    )

@router.post(
    "/{ebook_id}/download",
    response_model=EbookResponse,
)
async def download_ebook(
    ebook_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await EbookService(db).download_ebook(
        ebook_id,
        current_user,
    )


@router.get(
    "/{ebook_id}/activity",
)
async def ebook_activity(
    ebook_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return students/users who viewed or downloaded an ebook.
    Results are restricted to the current school.
    """

    ebook = await EbookService(db).get_ebook(
        ebook_id,
        current_user.school_id,
    )

    if not ebook:
        raise HTTPException(
            status_code=404,
            detail="Ebook not found",
        )

    result = await db.execute(
        select(
            EbookActivity,
            User,
        )
        .join(
            User,
            User.id == EbookActivity.user_id,
        )
        .where(
            EbookActivity.ebook_id == ebook_id,
            EbookActivity.school_id == current_user.school_id,
        )
        .order_by(
            EbookActivity.created_at.desc()
        )
    )

    rows = result.all()

    return [
        {
            "id": activity.id,
            "user_id": user.id,
            "student_name": (
                getattr(user, "full_name", None)
                or getattr(user, "name", None)
                or getattr(user, "email", None)
                or f"User #{user.id}"
            ),
            "email": getattr(user, "email", None),
            "activity_type": activity.activity_type,
            "created_at": activity.created_at,
        }
        for activity, user in rows
    ]


@router.post(
    "/{ebook_id}/view",
    response_model=EbookResponse,
)
async def view_ebook(
    ebook_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await EbookService(db).view_ebook(
        ebook_id,
        current_user,
    )

# ============================================================
# PROTECTED EBOOK COVER
# ============================================================

from pathlib import Path
from fastapi.responses import FileResponse

@router.get("/covers/{school_id}/{filename}")
async def protected_ebook_cover(
    school_id: int,
    filename: str,
    current_user: User = Depends(get_current_user),
):
    if current_user.school_id != school_id:
        raise HTTPException(
            status_code=403,
            detail="Access denied.",
        )

    cover_path = (
        Path.cwd()
        / "protected_ebooks"
        / str(school_id)
        / "covers"
        / filename
    ).resolve()

    cover_root = (
        Path.cwd()
        / "protected_ebooks"
        / str(school_id)
        / "covers"
    ).resolve()

    try:
        cover_path.relative_to(cover_root)
    except ValueError:
        raise HTTPException(
            status_code=403,
            detail="Invalid cover path.",
        )

    if not cover_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Cover image not found.",
        )

    return FileResponse(
        path=str(cover_path),
        headers={
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
        },
    )


# ============================================================
# PROTECTED EBOOK CONTENT
# ============================================================

from pathlib import Path
from fastapi.responses import FileResponse
from app.modules.ebooks.upload import BASE_DIR


@router.get("/{ebook_id}/content")
async def protected_ebook_content(
    ebook_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Protected ebook content endpoint.

    The PDF is stored inside protected_ebooks and is NEVER
    exposed through the public /uploads directory.
    Authentication + school ownership are required.
    """

    service = EbookService(db)

    ebook = await service.get_ebook(
        ebook_id,
        current_user.school_id,
    )

    if not ebook:
        raise HTTPException(
            status_code=404,
            detail="Ebook not found.",
        )

    if not ebook.file_url:
        raise HTTPException(
            status_code=404,
            detail="Ebook file unavailable.",
        )

    filename = Path(
        ebook.file_url.split("?")[0]
    ).name

    protected_file = (
        Path.cwd()
        / "protected_ebooks"
        / str(current_user.school_id)
        / "files"
        / filename
    ).resolve()

    protected_root = (
        Path.cwd()
        / "protected_ebooks"
        / str(current_user.school_id)
        / "files"
    ).resolve()

    try:
        protected_file.relative_to(protected_root)
    except ValueError:
        raise HTTPException(
            status_code=403,
            detail="Invalid ebook path.",
        )

    if not protected_file.is_file():
        raise HTTPException(
            status_code=404,
            detail="Ebook file is unavailable.",
        )

    return FileResponse(
        path=str(protected_file),
        media_type=ebook.file_type or "application/pdf",
        filename=ebook.file_name or filename,
        headers={
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
            "Content-Disposition": "inline",
        },
    )
