from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.ebooks.schemas import (
    EbookCreateRequest,
    EbookResponse,
)
from app.modules.ebooks.service import EbookService


router = APIRouter(
    prefix="/ebooks",
    tags=["Ebooks"],
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
    return await EbookService(
        db
    ).create_ebook(
        payload,
        current_user,
    )


@router.get(
    "",
    response_model=list[EbookResponse],
)
async def get_ebooks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await EbookService(
        db
    ).get_ebooks(
        current_user
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
        ebook_id
    )
