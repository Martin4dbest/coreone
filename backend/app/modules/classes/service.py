from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.classroom import Classroom
from app.models.level import Level

from app.modules.classes.repository import ClassRepository
from app.modules.classes.schemas import ClassCreateRequest


class ClassService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = ClassRepository(db)


    async def create_class(
        self,
        payload: ClassCreateRequest,
        current_user,
    ):
        school_id = payload.school_id

        if current_user.role.name != "SUPER_ADMIN":
            if school_id != current_user.school_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You cannot create classes for another school",
                )

        result = await self.db.execute(
            select(Level).where(
                Level.id == payload.level_id,
                Level.school_id == school_id,
            )
        )

        level = result.scalar_one_or_none()

        if not level:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected level does not belong to this school",
            )

        classroom = Classroom(
            school_id=school_id,
            level_id=payload.level_id,
            name=payload.name,
        )

        return await self.repository.create(classroom)


    async def get_classes(
        self,
        current_user,
    ):
        school_id = None

        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

        return await self.repository.get_all(
            school_id
        )


    async def get_class(
        self,
        class_id: int,
        current_user,
    ):
        school_id = None

        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

        classroom = await self.repository.get_by_id(
            class_id,
            school_id,
        )

        if not classroom:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class not found",
            )

        return classroom


    async def activate_class(
        self,
        class_id: int,
        current_user,
    ):
        classroom = await self.repository.get_by_id(
            class_id,
            current_user.school_id
            if current_user.role.name != "SUPER_ADMIN"
            else None,
        )

        if not classroom:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class not found",
            )

        classroom.is_active = True

        return await self.repository.update(classroom)


    async def deactivate_class(
        self,
        class_id: int,
        current_user,
    ):
        classroom = await self.repository.get_by_id(
            class_id,
            current_user.school_id
            if current_user.role.name != "SUPER_ADMIN"
            else None,
        )

        if not classroom:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class not found",
            )

        classroom.is_active = False

        return await self.repository.update(classroom)
