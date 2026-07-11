from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.teacher import Teacher
from app.models.user import User


class TeacherRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(
        self,
        school_id: int | None = None,
    ):
        query = (
            select(Teacher)
            .join(Teacher.user)
            .options(selectinload(Teacher.user))
        )

        if school_id is not None:
            query = query.where(
                User.school_id == school_id
            )

        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_by_id(
        self,
        teacher_id: int,
        school_id: int | None = None,
    ):
        query = (
            select(Teacher)
            .join(Teacher.user)
            .options(selectinload(Teacher.user))
            .where(Teacher.id == teacher_id)
        )

        if school_id is not None:
            query = query.where(
                User.school_id == school_id
            )

        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def create(self, teacher: Teacher):
        self.db.add(teacher)
        await self.db.commit()
        await self.db.refresh(teacher)
        return teacher
