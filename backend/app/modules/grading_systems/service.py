from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.grading_system import GradingSystem
from app.models.user import User
from app.modules.grading_systems.repository import (
    GradingSystemRepository,
)
from app.modules.grading_systems.schemas import (
    GradingSystemCreateRequest,
    GradingSystemUpdateRequest,
)


class GradingSystemService:

    def __init__(self, db: AsyncSession):
        self.repository = GradingSystemRepository(db)

    async def create_grading_system(
        self,
        payload: GradingSystemCreateRequest,
        current_user: User,
    ):
        if current_user.role.name != "SUPER_ADMIN":
            if payload.school_id != current_user.school_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You cannot manage another school's grading system",
                )

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

    async def get_grading_systems(
        self,
        school_id: int | None = None,
        current_user: User = None,
    ):
        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

        return await self.repository.get_all(
            school_id
        )

    async def update_grading_system(
        self,
        grading_system_id: int,
        payload: GradingSystemUpdateRequest,
        current_user: User,
    ):
        grading_system = await self.repository.get_by_id(
            grading_system_id
        )

        if not grading_system:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Grading system not found",
            )

        if current_user.role.name != "SUPER_ADMIN":
            if grading_system.school_id != current_user.school_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You cannot modify another school's grading system",
                )

        grading_system.grade = payload.grade
        grading_system.minimum_score = payload.minimum_score
        grading_system.maximum_score = payload.maximum_score
        grading_system.remark = payload.remark

        return await self.repository.update(
            grading_system
        )


    async def delete_grading_system(
            self,
            grading_system_id: int,
            current_user: User,
        ):
            grading_system = await self.repository.get_by_id(
                grading_system_id
            )
    
            if not grading_system:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Grading system not found",
                )
    
            if current_user.role.name != "SUPER_ADMIN":
                if grading_system.school_id != current_user.school_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You cannot delete another school's grading system",
                    )
    
            await self.repository.delete(
                grading_system
            )
    
            return {
                "message": "Grading system deleted successfully"
            }
    
    
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