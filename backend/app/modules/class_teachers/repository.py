from sqlalchemy import select

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.classroom import Classroom
from app.models.teacher import Teacher
from app.models.teacher_subject import TeacherSubject
from app.models.result import Result


class ClassTeacherRepository:

    def __init__(
        self,
        db: AsyncSession,
    ):
        self.db = db


    async def get_classroom(
        self,
        classroom_id: int,
        school_id: int,
    ):

        result = await self.db.execute(
            select(Classroom)
            .options(
                selectinload(
                    Classroom.class_teacher
                )
            )
            .where(
                Classroom.id == classroom_id,
                Classroom.school_id == school_id,
            )
        )

        return result.scalar_one_or_none()



    async def get_teacher(
        self,
        teacher_id: int,
        school_id: int,
    ):

        result = await self.db.execute(
            select(Teacher)
            .where(
                Teacher.id == teacher_id,
                Teacher.school_id == school_id,
            )
        )

        return result.scalar_one_or_none()



    async def get_teacher_class(
        self,
        teacher_id: int,
        school_id: int,
    ):

        result = await self.db.execute(
            select(Classroom)
            .where(
                Classroom.class_teacher_id == teacher_id,
                Classroom.school_id == school_id,
            )
        )

        return result.scalar_one_or_none()



    async def get_class_subjects(
        self,
        classroom_id: int,
        school_id: int,
        session_id: int,
    ):

        result = await self.db.execute(
            select(TeacherSubject)
            .options(
                selectinload(
                    TeacherSubject.teacher
                ),
                selectinload(
                    TeacherSubject.subject
                ),
            )
            .where(
                TeacherSubject.classroom_id == classroom_id,
                TeacherSubject.school_id == school_id,
                TeacherSubject.academic_session_id == session_id,
                TeacherSubject.is_active == True,
            )
        )

        return result.scalars().unique().all()



    async def count_published_results(
        self,
        classroom_id: int,
        subject_id: int,
        term_id: int,
        session_id: int,
        school_id: int,
    ):

        result = await self.db.execute(
            select(Result)
            .where(
                Result.class_id == classroom_id,
                Result.subject_id == subject_id,
                Result.term_id == term_id,
                Result.academic_session_id == session_id,
                Result.school_id == school_id,
                Result.status == "PUBLISHED",
            )
        )

        return len(
            result.scalars().all()
        )



    async def save(
        self,
        classroom: Classroom,
    ):

        await self.db.commit()
        await self.db.refresh(
            classroom
        )

        return classroom

    async def get_teacher_by_user(
        self,
        user_id: int,
        school_id: int,
    ):

        result = await self.db.execute(
            select(Teacher).where(
                Teacher.user_id == user_id,
                Teacher.school_id == school_id,
            )
        )

        return result.scalar_one_or_none()

