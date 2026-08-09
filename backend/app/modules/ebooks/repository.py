from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ebook import Ebook
from app.models.ebook_student_access import EbookStudentAccess


class EbookRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(
        self,
        school_id: int,
        search: str | None = None,
        category: str | None = None,
        subject_id: int | None = None,
        classroom_id: int | None = None,
        featured: bool | None = None,
        include_archived: bool = False,
        student_only: bool = False,
        student_id: int | None = None,
    ):
        conditions = [
            Ebook.school_id == school_id,
        ]

        # By default only active ebooks are returned.
        # When include_archived=True, archived ebooks are included too.
        if not include_archived:
            conditions.append(
                Ebook.is_active.is_(True)
            )

        # is_active controls archive/restore.
        # is_published controls student visibility.
        if student_only:
            if student_id is None:
                raise ValueError(
                    "student_id is required for student ebook access."
                )

            direct_access = select(
                EbookStudentAccess.id
            ).where(
                EbookStudentAccess.ebook_id == Ebook.id,
                EbookStudentAccess.student_id == student_id,
                EbookStudentAccess.school_id == school_id,
                EbookStudentAccess.is_active.is_(True),
            ).exists()

            conditions.append(
                Ebook.is_published.is_(True) | direct_access
            )

        result = await self.db.execute(
            select(Ebook)
            .where(*conditions)
            .order_by(
                Ebook.featured.desc(),
                Ebook.created_at.desc(),
                Ebook.title.asc(),
            )
        )

        return result.scalars().all()

    async def get_recent(
        self,
        school_id: int,
        limit: int = 10,
        student_only: bool = False,
        student_id: int | None = None,
    ):
        conditions = [
            Ebook.school_id == school_id,
            Ebook.is_active.is_(True),
        ]

        if student_only:
            if student_id is None:
                raise ValueError(
                    "student_id is required for student ebook access."
                )

            direct_access = select(EbookStudentAccess.id).where(
                EbookStudentAccess.ebook_id == Ebook.id,
                EbookStudentAccess.student_id == student_id,
                EbookStudentAccess.school_id == school_id,
                EbookStudentAccess.is_active.is_(True),
            ).exists()

            conditions.append(
                Ebook.is_published.is_(True) | direct_access
            )

        result = await self.db.execute(
            select(Ebook)
            .where(*conditions)
            .order_by(
                Ebook.created_at.desc()
            )
            .limit(limit)
        )

        return result.scalars().all()

    async def get_categories(
        self,
        school_id: int,
    ):
        result = await self.db.execute(
            select(Ebook.category)
            .where(
                Ebook.school_id == school_id,
                Ebook.is_active.is_(True),
                Ebook.category.is_not(None),
            )
            .distinct()
            .order_by(Ebook.category)
        )

        return [
            row[0]
            for row in result.all()
            if row[0]
        ]

    async def get_by_id(
        self,
        ebook_id: int,
        school_id: int | None = None,
    ):
        conditions = [
            Ebook.id == ebook_id,
        ]

        if school_id is not None:
            conditions.append(
                Ebook.school_id == school_id
            )

        result = await self.db.execute(
            select(Ebook).where(*conditions)
        )

        return result.scalar_one_or_none()

    async def create(
        self,
        ebook: Ebook,
    ):
        self.db.add(ebook)

        await self.db.commit()
        await self.db.refresh(ebook)

        return ebook

    async def update(
        self,
        ebook: Ebook,
    ):
        await self.db.commit()
        await self.db.refresh(ebook)

        return ebook

    async def increment_download(
        self,
        ebook: Ebook,
    ):
        ebook.download_count += 1

        await self.db.commit()
        await self.db.refresh(ebook)

        return ebook

    async def increment_view(
        self,
        ebook: Ebook,
    ):
        ebook.view_count += 1

        await self.db.commit()
        await self.db.refresh(ebook)

        return ebook

    async def archive(
        self,
        ebook: Ebook,
    ):
        ebook.is_active = False

        await self.db.commit()

        return {
            "success": True,
            "message": "Ebook archived successfully.",
        }

    async def delete_permanently(
        self,
        ebook: Ebook,
    ):
        await self.db.delete(ebook)
        await self.db.commit()

        return {
            "success": True,
            "message": "Ebook permanently deleted.",
        }
