from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.classroom import Classroom
from app.modules.classes.repository import ClassRepository
from app.modules.classes.schemas import ClassCreateRequest


class ClassService:

    def __init__(self, db: AsyncSession):
        self.repository = ClassRepository(db)

    async def create_class(
        self,
        payload: ClassCreateRequest,
    ):
        classroom = Classroom(
            school_id=payload.school_id,
            level_id=payload.level_id,
            name=payload.name,
        )

        return await self.repository.create(classroom)

    async def get_classes(self):
        return await self.repository.get_all()

    async def get_class(
        self,
        class_id: int,
    ):
        classroom = await self.repository.get_by_id(
            class_id
        )

        if not classroom:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class not found",
            )

        return classroom
