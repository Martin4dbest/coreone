from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ebook import Ebook
from app.modules.ebooks.repository import EbookRepository
from app.modules.ebooks.schemas import EbookCreateRequest


class EbookService:

    def __init__(self, db: AsyncSession):
        self.repository = EbookRepository(db)

    async def create_ebook(
        self,
        payload: EbookCreateRequest,
    ):
        ebook = Ebook(
            school_id=payload.school_id,
            title=payload.title,
            author=payload.author,
            description=payload.description,
            file_url=payload.file_url,
            category=payload.category,
            uploaded_by=payload.uploaded_by,
            is_active=True,
        )

        return await self.repository.create(
            ebook
        )

    async def get_ebooks(self):
        return await self.repository.get_all()

    async def get_ebook(
        self,
        ebook_id: int,
    ):
        ebook = await self.repository.get_by_id(
            ebook_id
        )

        if not ebook:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ebook not found",
            )

        return ebook
