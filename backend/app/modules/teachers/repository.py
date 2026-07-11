from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.teacher import Teacher


class TeacherRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(
            select(Teacher)
        )
        return result.scalars().all()

    async def get_by_id(self, teacher_id: int):
        result = await self.db.execute(
            select(Teacher).where(
                Teacher.id == teacher_id
            )
        )
        return result.scalar_one_or_none()

    async def create(self, teacher: Teacher):
        self.db.add(teacher)
        await self.db.commit()
        await self.db.refresh(teacher)
        return teacher
