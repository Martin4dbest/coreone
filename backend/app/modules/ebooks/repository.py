from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ebook import Ebook


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
    ):
        conditions = [
            Ebook.school_id == school_id,
            Ebook.is_active.is_(True),
        ]

        if search:
            pattern = f"%{search.strip()}%"

            conditions.append(
                or_(
                    Ebook.title.ilike(pattern),
                    Ebook.author.ilike(pattern),
                    Ebook.description.ilike(pattern),
                )
            )

        if category:
            conditions.append(
                Ebook.category == category
            )

        if subject_id is not None:
            conditions.append(
                Ebook.subject_id == subject_id
            )

        if classroom_id is not None:
            conditions.append(
                Ebook.classroom_id == classroom_id
            )

        if featured is not None:
            conditions.append(
                Ebook.featured == featured
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
    ):
        result = await self.db.execute(
            select(Ebook)
            .where(
                Ebook.school_id == school_id,
                Ebook.is_active.is_(True),
            )
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
