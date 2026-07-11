from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.level import Level


class LevelRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(
            select(Level)
        )
        return result.scalars().all()

    async def get_by_id(self, level_id: int):
        result = await self.db.execute(
            select(Level).where(Level.id == level_id)
        )
        return result.scalar_one_or_none()

    async def create(self, level: Level):
        self.db.add(level)
        await self.db.commit()
        await self.db.refresh(level)
        return level
