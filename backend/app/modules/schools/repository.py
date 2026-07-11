from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.school import School


class SchoolRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(select(School))
        return result.scalars().all()

    async def get_by_id(self, school_id: int):
        result = await self.db.execute(
            select(School).where(School.id == school_id)
        )
        return result.scalar_one_or_none()

    async def get_by_code(self, school_code: str):
        result = await self.db.execute(
            select(School).where(School.school_code == school_code)
        )
        return result.scalar_one_or_none()

    async def create(self, school: School):
        self.db.add(school)
        await self.db.commit()
        await self.db.refresh(school)
        return school
