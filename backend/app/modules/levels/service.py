from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.level import Level
from app.modules.levels.repository import LevelRepository
from app.modules.levels.schemas import LevelCreateRequest


class LevelService:

    def __init__(self, db: AsyncSession):
        self.repository = LevelRepository(db)

    async def create_level(self, payload: LevelCreateRequest):
        level = Level(
            school_id=payload.school_id,
            name=payload.name,
        )

        return await self.repository.create(level)

    async def get_levels(self):
        return await self.repository.get_all()

    async def get_level(self, level_id: int):
        level = await self.repository.get_by_id(level_id)

        if not level:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Level not found",
            )

        return level
