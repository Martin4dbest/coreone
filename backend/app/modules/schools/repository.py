from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.school import School


class SchoolRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, school: School) -> School:
        self.db.add(school)
        await self.db.commit()
        await self.db.refresh(school)
        return school

    async def get_all(self) -> list[School]:
        result = await self.db.execute(
            select(School).order_by(School.name)
        )
        return result.scalars().all()

    async def get_by_id(self, school_id: int) -> School | None:
        result = await self.db.execute(
            select(School).where(School.id == school_id)
        )
        return result.scalar_one_or_none()

    async def get_by_code(
        self,
        school_code: str,
    ) -> School | None:
        # Authentication/tenant codes are normalized so that
        # accidental whitespace or casing differences do not
        # cause a valid school to fail authentication.
        normalized_code = school_code.strip().upper()

        result = await self.db.execute(
            select(School).where(
                School.school_code.ilike(normalized_code)
            )
        )

        return result.scalar_one_or_none()

    async def get_by_slug(
        self,
        slug: str,
    ) -> School | None:
        # Tenant URLs are generated directly from school_code.
        # Resolve case-insensitively so /abc123 and /ABC123
        # both resolve to the same school.
        result = await self.db.execute(
            select(School).where(
                School.school_code.ilike(slug)
            )
        )
        return result.scalar_one_or_none()

    async def update(self, school: School) -> School:
        await self.db.commit()
        await self.db.refresh(school)
        return school

    async def delete(self, school: School) -> None:
        await self.db.delete(school)
        await self.db.commit()