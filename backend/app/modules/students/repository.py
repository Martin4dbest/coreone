from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.student import Student


class StudentRepository:

    def __init__(self, db: AsyncSession):
        self.db = db


    async def get_all(
        self,
        school_id: int | None = None,
    ):
        query = (
            select(Student)
            .options(
                selectinload(Student.user),
                selectinload(Student.classroom),
            )
        )

        if school_id is not None:
            query = query.where(
                Student.school_id == school_id
            )

        result = await self.db.execute(query)

        return result.scalars().all()


    async def get_by_id(
        self,
        student_id: int,
        school_id: int | None = None,
    ):
        query = (
            select(Student)
            .options(
                selectinload(Student.user),
                selectinload(Student.classroom),
            )
            .where(
                Student.id == student_id
            )
        )

        if school_id is not None:
            query = query.where(
                Student.school_id == school_id
            )

        result = await self.db.execute(query)

        return result.scalar_one_or_none()


    async def get_by_admission_number(
        self,
        admission_number: str,
        school_id: int,
    ):
        result = await self.db.execute(
            select(Student).where(
                Student.school_id == school_id,
                Student.admission_number == admission_number,
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

    async def update(self, student: Student):
        await self.db.commit()
        await self.db.refresh(student)
        return student

