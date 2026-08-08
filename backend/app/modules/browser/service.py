from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.browser_link import BrowserLink
from app.modules.browser.repository import BrowserLinkRepository
from app.modules.browser.schemas import BrowserLinkCreateRequest



class BrowserLinkService:


    def __init__(
        self,
        db: AsyncSession
    ):

        self.repository = BrowserLinkRepository(db)



    async def create_link(
        self,
        payload: BrowserLinkCreateRequest,
        current_user,
    ):


        link = BrowserLink(
            school_id=current_user.school_id,
            title=payload.title,
            url=payload.url,
            description=payload.description,
            category=payload.category,
            created_by=current_user.id,
            is_active=True,
        )


        return await self.repository.create(
            link
        )



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
        link_id:int,
    ):


        link = await self.repository.get_by_id(
            link_id
        )


        if not link:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Browser link not found",
            )


        return link