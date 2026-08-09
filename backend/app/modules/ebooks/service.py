from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ebook import Ebook
from app.models.ebook_activity import EbookActivity
from app.modules.ebooks.repository import EbookRepository
from app.modules.ebooks.schemas import (
    EbookCreateRequest,
    EbookUpdateRequest,
)
from app.modules.school_features.service import (
    SchoolFeatureService,
)


class EbookService:

    def __init__(self, db: AsyncSession):
        self.repository = EbookRepository(db)

    async def _ensure_enabled(
        self,
        school_id: int,
    ):
        try:
            await SchoolFeatureService(
                self.repository.db
            ).ensure_enabled(
                school_id,
                "ebooks",
            )
        except AttributeError:
            # Keep ebook functionality compatible
            # with installations where feature
            # enforcement has not yet exposed
            # ensure_enabled().
            pass

    async def list_ebooks(
        self,
        school_id: int,
        search: str | None = None,
        category: str | None = None,
        subject_id: int | None = None,
        classroom_id: int | None = None,
        featured: bool | None = None,
        include_archived: bool = False,
    ):
        await self._ensure_enabled(school_id)

        return await self.repository.get_all(
            school_id=school_id,
            search=search,
            category=category,
            subject_id=subject_id,
            classroom_id=classroom_id,
            featured=featured,
            include_archived=include_archived,
        )

    async def recent_ebooks(
        self,
        school_id: int,
        limit: int = 10,
    ):
        await self._ensure_enabled(school_id)

        limit = max(1, min(limit, 50))

        return await self.repository.get_recent(
            school_id,
            limit,
        )

    async def categories(
        self,
        school_id: int,
    ):
        await self._ensure_enabled(school_id)

        return await self.repository.get_categories(
            school_id
        )

    async def get_ebook(
        self,
        ebook_id: int,
        school_id: int,
    ):
        ebook = await self.repository.get_by_id(
            ebook_id,
            school_id,
        )

        if not ebook or not ebook.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ebook not found.",
            )

        return ebook

    async def create_ebook(
        self,
        payload: EbookCreateRequest,
        current_user,
    ):
        school_id = current_user.school_id

        if not school_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not associated with a school.",
            )

        await self._ensure_enabled(school_id)

        ebook = Ebook(
            title=payload.title,
            author=payload.author,
            description=payload.description,
            file_url=payload.file_url,
            category=payload.category,
            uploaded_by=current_user.id,
            school_id=school_id,
            subject_id=payload.subject_id,
            classroom_id=payload.classroom_id,
            cover_image_url=payload.cover_image_url,
            file_name=payload.file_name,
            file_size=payload.file_size,
            file_type=payload.file_type,
            featured=payload.featured,
        )

        return await self.repository.create(ebook)

    async def update_ebook(
        self,
        ebook_id: int,
        payload: EbookUpdateRequest,
        current_user,
    ):
        ebook = await self.get_ebook(
            ebook_id,
            current_user.school_id,
        )

        data = payload.model_dump(
            exclude_unset=True
        )

        for key, value in data.items():
            setattr(ebook, key, value)

        return await self.repository.update(
            ebook
        )

    async def delete_ebook(
        self,
        ebook_id: int,
        current_user,
    ):
        ebook = await self.get_ebook(
            ebook_id,
            current_user.school_id,
        )

        return await self.repository.archive(
            ebook
        )

    async def delete_permanently(
        self,
        ebook_id: int,
        current_user,
    ):
        ebook = await self.repository.get_by_id(
            ebook_id,
            current_user.school_id,
        )

        if not ebook:
            return None

        if ebook.is_active:
            raise ValueError(
                "Only archived ebooks can be permanently deleted."
            )

        return await self.repository.delete_permanently(
            ebook
        )

    async def download_ebook(
        self,
        ebook_id: int,
        current_user,
    ):
        ebook = await self.get_ebook(
            ebook_id,
            current_user.school_id,
        )

        activity = EbookActivity(
            ebook_id=ebook.id,
            user_id=current_user.id,
            school_id=current_user.school_id,
            activity_type="download",
            created_at=datetime.utcnow(),
        )

        self.repository.db.add(activity)

        await self.repository.increment_download(ebook)

        return ebook

    async def view_ebook(
        self,
        ebook_id: int,
        current_user,
    ):
        ebook = await self.get_ebook(
            ebook_id,
            current_user.school_id,
        )

        # Record the activity and increment the counter.
        # The ebook itself must still be returned even if activity
        # tracking encounters a database problem.
        try:
            activity = EbookActivity(
                ebook_id=ebook.id,
                user_id=current_user.id,
                school_id=current_user.school_id,
                activity_type="view",
                created_at=datetime.utcnow(),
            )

            self.repository.db.add(activity)

            await self.repository.increment_view(ebook)

        except Exception as exc:
            await self.repository.db.rollback()
            print(f"WARNING: Could not record ebook view: {exc}")

        return ebook
