from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.school import School


class SchoolRepository:

    def __init__(self, db: AsyncSession):
        self.db = db


    async def get_by_code(
        self,
        school_code: str,
    ) -> School | None:

        result = await self.db.execute(
            select(School).where(
                School.school_code == school_code
            )
        )

        return result.scalar_one_or_none()
