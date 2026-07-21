from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.teacher_subject import TeacherSubject


class TeacherAssignmentRepository:

    def __init__(self, db: AsyncSession):
        self.db = db


    async def get_existing_assignment(
        self,
        school_id: int,
        teacher_id: int,
        classroom_id: int,
        subject_id: int,
        academic_session_id: int,
    ):

        result = await self.db.execute(
            select(TeacherSubject).where(
                TeacherSubject.school_id == school_id,
                TeacherSubject.teacher_id == teacher_id,
                TeacherSubject.classroom_id == classroom_id,
                TeacherSubject.subject_id == subject_id,
                TeacherSubject.academic_session_id == academic_session_id,
            )
        )

        return result.scalar_one_or_none()


    async def create(
        self,
        assignment: TeacherSubject,
    ):

        self.db.add(assignment)

        await self.db.commit()

        await self.db.refresh(assignment)

        return assignment


    async def get_teacher_assignments(
        self,
        teacher_id: int,
        school_id: int,
    ):

        result = await self.db.execute(
            select(TeacherSubject).where(
                TeacherSubject.teacher_id == teacher_id,
                TeacherSubject.school_id == school_id,
                TeacherSubject.is_active == True,
            )
        )

        return result.scalars().all()


async def get_class_assignments(
    self,
    classroom_id: int,
    school_id: int,
):

    result = await self.db.execute(
        select(TeacherSubject).where(
            TeacherSubject.classroom_id == classroom_id,
            TeacherSubject.school_id == school_id,
            TeacherSubject.is_active == True,
        )
    )

    return result.scalars().all()



async def get_school_assignments(
    self,
    school_id: int,
):

    result = await self.db.execute(
        select(TeacherSubject).where(
            TeacherSubject.school_id == school_id,
            TeacherSubject.is_active == True,
        )
    )

    return result.scalars().all()



async def deactivate_assignment(
    self,
    assignment: TeacherSubject,
):

    assignment.is_active = False

    await self.db.commit()

    await self.db.refresh(
        assignment
    )

    return assignment


async def update(
    self,
    assignment: TeacherSubject,
):
    await self.db.commit()

    await self.db.refresh(
        assignment
    )

    return assignment
