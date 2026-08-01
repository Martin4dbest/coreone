from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ebook import Ebook
from app.modules.ebooks.repository import EbookRepository
from app.modules.school_features.repository import SchoolFeatureRepository
from app.modules.ebooks.schemas import EbookCreateRequest
from app.modules.school_features.service import SchoolFeatureService



class EbookService:

    async def _ensure_enabled(
        self,
        school_id: int,
    ):
        feature = await SchoolFeatureRepository(
            self.repository.db
        ).get_feature(
            school_id,
            "ebooks",
        )

        if feature and not feature.enabled:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Ebooks have been disabled for this school.",
            )

    def __init__(self, db: AsyncSession):
        self.repository = EbookRepository(db)

    async def create_ebook(
        self,
        payload: EbookCreateRequest,
        current_user,
    ):
        await SchoolFeatureService(
            self.repository.db
        ).ensure_enabled(
            school_id=current_user.school_id,
            feature_key="ebooks",
        )

        await self._ensure_enabled(
            payload.school_id
        )

        ebook = Ebook(
            school_id=current_user.school_id,
            title=payload.title,
            author=payload.author,
            description=payload.description,
            file_url=payload.file_url,
            category=payload.category,
            uploaded_by=current_user.id,
            is_active=True,
        )

        return await self.repository.create(
            ebook
        )

    async def get_ebooks(
        self,
        current_user,
    ):
        await SchoolFeatureService(
            self.repository.db
        ).ensure_enabled(
            school_id=current_user.school_id,
            feature_key="ebooks",
        )

        return await self.repository.get_all(
            current_user.school_id
        )

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
