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
            .options(
            selectinload(Teacher.user),
            selectinload(Teacher.teacher_subjects),
        )
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
            .options(
            selectinload(Teacher.user),
            selectinload(Teacher.teacher_subjects),
        )
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

    async def get_teacher_assignments_summary(
        self,
        teacher_id: int,
        school_id: int | None = None,
    ):
        from app.models.classroom import Classroom
        from app.models.teacher_subject import TeacherSubject
        from app.models.subject import Subject

        # 1. Fetch the teacher profile
        teacher = await self.get_by_id(teacher_id, school_id)

        if not teacher:
            return None

        # 2. Get classes where they are designated as the main class teacher
        class_result = await self.db.execute(
            select(Classroom).where(
                Classroom.class_teacher_id == teacher_id
            )
        )
        classes = class_result.scalars().all()

        # 3. Fetch active subject/classroom assignments using select_from to prevent UndefinedTableError
        subject_result = await self.db.execute(
            select(
                TeacherSubject.id.label("id"),
                Classroom.name.label("classroom_name"),
                Subject.name.label("subject_name"),
            )
            .select_from(TeacherSubject)
            .join(Classroom, Classroom.id == TeacherSubject.classroom_id)
            .join(Subject, Subject.id == TeacherSubject.subject_id)
            .where(
                TeacherSubject.teacher_id == teacher_id,
                TeacherSubject.is_active == True,
            )
        )

        subjects = []
        for row in subject_result.all():
            subjects.append(
                {
                    "id": row.id,
                    "classroom": row.classroom_name,
                    "subject": row.subject_name,
                }
            )

        return {
            "teacher": f"{teacher.first_name} {teacher.last_name}",
            "class_teacher_of": [item.name for item in classes],
            "subjects": subjects,
        }