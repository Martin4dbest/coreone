from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.result import Result


class ResultRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(
            select(Result).order_by(
                Result.created_at.desc()
            )
        )
        return result.scalars().all()

    async def get_by_id(self, result_id: int):
        result = await self.db.execute(
            select(Result).where(
                Result.id == result_id
            )
        )
        return result.scalar_one_or_none()

    async def create(self, result: Result):
        self.db.add(result)
        await self.db.commit()
        await self.db.refresh(result)
        return result
