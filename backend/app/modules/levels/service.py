from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.level import Level
from app.modules.levels.repository import LevelRepository
from app.modules.levels.schemas import LevelCreateRequest


class LevelService:

    def __init__(self, db: AsyncSession):
        self.repository = LevelRepository(db)

    async def create_level(
        self,
        payload: LevelCreateRequest,
        current_user,
    ):
        school_id = payload.school_id

        # SUPER_ADMIN can create levels for any school.
        # Other users can only create levels for their assigned school.
        if current_user.role.name != "SUPER_ADMIN":
            if school_id != current_user.school_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You cannot create levels for another school",
                )

        level = Level(
            school_id=school_id,
            name=payload.name,
        )

        return await self.repository.create(level)

    async def get_levels(
        self,
        current_user,
    ):
        school_id = None

        # SUPER_ADMIN can see levels across all schools.
        # School users only see levels from their own school.
        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

        return await self.repository.get_all(
            school_id
        )

    async def get_level(
        self,
        level_id: int,
        current_user,
    ):
        school_id = None

        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

        level = await self.repository.get_by_id(
            level_id,
            school_id,
        )

        if not level:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Level not found",
            )

        return level

    async def deactivate_level(
        self,
        level_id: int,
    ):
        level = await self.repository.get_by_id(
            level_id,
            None,
        )

        if not level:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Level not found",
            )

        level.is_active = False

        return await self.repository.update(level)


    async def activate_level(
        self,
        level_id: int,
    ):
        level = await self.repository.get_by_id(
            level_id,
            None,
        )

        if not level:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Level not found",
            )

        level.is_active = True

        return await self.repository.update(level)

