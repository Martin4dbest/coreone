from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.teacher import Teacher
from app.models.classroom import Classroom
from app.models.teacher_subject import TeacherSubject


class TeacherRepository:

    def __init__(self, db: AsyncSession):
        self.db = db


    async def get_all(
        self,
        school_id: int,
    ):

        query = (
            select(Teacher)
            .options(
                selectinload(Teacher.user),
                selectinload(Teacher.teacher_subjects)
            )
        )

        if school_id is not None:
            query = query.where(
                Teacher.school_id == school_id
            )

        result = await self.db.execute(query)

        return result.scalars().unique().all()



    async def get_by_id(
        self,
        teacher_id: int,
        school_id: int,
    ):

        query = (
            select(Teacher)
            .options(
                selectinload(Teacher.user),
                selectinload(Teacher.teacher_subjects)
            )
            .where(
                Teacher.id == teacher_id
            )
        )

        if school_id is not None:
            query = query.where(
                Teacher.school_id == school_id
            )


        result = await self.db.execute(query)

        return result.scalar_one_or_none()



    async def get_by_user(
        self,
        user_id: int,
    ):

        result = await self.db.execute(
            select(Teacher)
            .where(
                Teacher.user_id == user_id
            )
        )

        return result.scalar_one_or_none()



    async def create(
        self,
        teacher: Teacher,
    ):

        self.db.add(teacher)

        await self.db.commit()

        await self.db.refresh(
            teacher
        )

        return await self.get_by_id(
            teacher.id,
            teacher.school_id
        )



    async def update(
        self,
        teacher: Teacher,
    ):

        await self.db.commit()

        await self.db.refresh(
            teacher
        )

        return teacher



    async def get_class_teacher(
        self,
        teacher_id: int,
    ):

        result = await self.db.execute(
            select(Classroom)
            .options(
                selectinload(Classroom.level)
            )
            .where(
                Classroom.class_teacher_id == teacher_id
            )
        )

        return result.scalar_one_or_none()



    async def get_teacher_assignments_summary(
        self,
        teacher_id: int,
        school_id: int,
    ):

        query = (
            select(TeacherSubject)
            .options(
                selectinload(
                    TeacherSubject.subject
                ),
                selectinload(
                    TeacherSubject.classroom
                )
            )
            .where(
                TeacherSubject.teacher_id == teacher_id
            )
        )


        if school_id is not None:

            query = query.where(
                TeacherSubject.school_id == school_id
            )


        result = await self.db.execute(query)

        return result.scalars().unique().all()


    async def delete(
        self,
        teacher
    ):
        await self.db.delete(teacher)
        await self.db.commit()
