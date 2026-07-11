from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.browser.schemas import (
    BrowserLinkCreateRequest,
    BrowserLinkResponse,
)
from app.modules.browser.service import BrowserLinkService


router = APIRouter(
    prefix="/browser-links",
    tags=["Internal Browser"],
)


@router.post(
    "",
    response_model=BrowserLinkResponse,
)
async def create_browser_link(
    payload: BrowserLinkCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await BrowserLinkService(db).create_link(
        payload
    )


@router.get(
    "",
    response_model=list[BrowserLinkResponse],
)
async def get_browser_links(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await BrowserLinkService(db).get_links()


@router.get(
    "/{link_id}",
    response_model=BrowserLinkResponse,
)
async def get_browser_link(
    link_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await BrowserLinkService(db).get_link(
        link_id
    )
