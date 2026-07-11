from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.grading_system import GradingSystem
from app.modules.grading_systems.repository import (
    GradingSystemRepository,
)
from app.modules.grading_systems.schemas import (
    GradingSystemCreateRequest,
)


class GradingSystemService:

    def __init__(self, db: AsyncSession):
        self.repository = GradingSystemRepository(db)

    async def create_grading_system(
        self,
        payload: GradingSystemCreateRequest,
    ):
        grading_system = GradingSystem(
            school_id=payload.school_id,
            grade=payload.grade,
            minimum_score=payload.minimum_score,
            maximum_score=payload.maximum_score,
            remark=payload.remark,
            is_active=True,
        )

        return await self.repository.create(
            grading_system
        )

    async def get_grading_systems(self):
        return await self.repository.get_all()

    async def get_grading_system(
        self,
        grading_system_id: int,
    ):
        grading_system = await self.repository.get_by_id(
            grading_system_id
        )

        if not grading_system:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Grading system not found",
            )

        return grading_system
