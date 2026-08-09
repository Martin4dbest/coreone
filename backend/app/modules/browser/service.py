from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.browser_link import BrowserLink
from app.modules.browser.repository import BrowserLinkRepository
from app.modules.browser.schemas import (
    BrowserLinkCreateRequest,
    BrowserLinkUpdateRequest,
)


class BrowserLinkService:

    def __init__(self, db: AsyncSession):
        self.repository = BrowserLinkRepository(db)

    async def create_link(
        self,
        payload: BrowserLinkCreateRequest,
        current_user,
    ):
        if not current_user.school_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not assigned to a school.",
            )

        link = BrowserLink(
            school_id=current_user.school_id,
            title=payload.title,
            url=payload.url,
            description=payload.description,
            category=payload.category,
            created_by=current_user.id,
            is_active=True,
        )

        return await self.repository.create(link)

    async def get_links(
        self,
        current_user,
    ):
        if current_user.role.name == "SUPER_ADMIN":
            return await self.repository.get_all()

        return await self.repository.get_all(
            current_user.school_id
        )

    async def get_link(
        self,
        link_id: int,
        current_user,
    ):
        if current_user.role.name == "SUPER_ADMIN":
            link = await self.repository.get_by_id(link_id)
        else:
            link = await self.repository.get_by_id(
                link_id,
                current_user.school_id,
            )

        if not link:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Browser link not found",
            )

        return link

    async def update_link(
        self,
        link_id: int,
        payload: BrowserLinkUpdateRequest,
        current_user,
    ):
        link = await self.get_link(
            link_id,
            current_user,
        )

        if payload.title is not None:
            link.title = payload.title

        if payload.url is not None:
            link.url = payload.url

        if payload.description is not None:
            link.description = payload.description

        if payload.category is not None:
            link.category = payload.category

        if payload.is_active is not None:
            link.is_active = payload.is_active

        await self.repository.commit()

        return link

    async def delete_link(
        self,
        link_id: int,
        current_user,
    ):
        link = await self.get_link(
            link_id,
            current_user,
        )

        await self.repository.delete(link)

        return {
            "message": "Browser link deleted successfully"
        }
