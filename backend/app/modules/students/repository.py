from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.student import Student


class StudentRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(
            select(Student)
        )
        return result.scalars().all()

    async def get_by_id(self, student_id: int):
        result = await self.db.execute(
            select(Student).where(
                Student.id == student_id
            )
        )
        return result.scalar_one_or_none()

    async def get_by_admission_number(
        self,
        admission_number: str,
    ):
        result = await self.db.execute(
            select(Student).where(
                Student.admission_number == admission_number
            )
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        student: Student,
    ):
        self.db.add(student)
        await self.db.commit()
        await self.db.refresh(student)
        return student
