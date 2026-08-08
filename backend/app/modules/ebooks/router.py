from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.models.ebook_activity import EbookActivity
from app.modules.auth.dependencies.current_user import (
    get_current_user,
)
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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    return await EbookService(db).list_ebooks(
        school_id=current_user.school_id,
        search=search,
        category=category,
        subject_id=subject_id,
        classroom_id=classroom_id,
        featured=featured,
    )


@router.get(
    "/recent",
    response_model=list[EbookResponse],
)
async def recent_ebooks(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
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
    current_user: User = Depends(
        get_current_user
    ),
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
    current_user: User = Depends(
        get_current_user
    ),
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
    current_user: User = Depends(
        get_current_user
    ),
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
    current_user: User = Depends(
        get_current_user
    ),
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
    current_user: User = Depends(
        get_current_user
    ),
):
    return await EbookService(db).delete_ebook(
        ebook_id,
        current_user,
    )


@router.post(
    "/{ebook_id}/download",
    response_model=EbookResponse,
)
async def download_ebook(
    ebook_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
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
    # Verify that the ebook belongs to the current school.
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
        .order_by(EbookActivity.created_at.desc())
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
    current_user: User = Depends(
        get_current_user
    ),
):
    return await EbookService(db).view_ebook(
        ebook_id,
        current_user,
    )
