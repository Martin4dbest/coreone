from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.grading_system import GradingSystem


class GradingSystemRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(
        self,
        school_id: int | None = None,
    ):
        query = select(GradingSystem).order_by(GradingSystem.minimum_score)

        if school_id is not None:
            query = query.where(
                GradingSystem.school_id == school_id
            )

        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_by_id(self, grading_system_id: int):
        result = await self.db.execute(
            select(GradingSystem).where(
                GradingSystem.id == grading_system_id
            )
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        grading_system: GradingSystem,
    ):
        self.db.add(grading_system)
        await self.db.commit()
        await self.db.refresh(grading_system)
        return grading_system
