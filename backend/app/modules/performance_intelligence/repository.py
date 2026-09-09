from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.academic_session import AcademicSession
from app.models.attendance import Attendance
from app.models.classroom import Classroom
from app.models.result import Result
from app.models.school import School
from app.models.student import Student
from app.models.subject import Subject
from app.models.term import Term


class PerformanceIntelligenceRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_student(
        self,
        student_id: int,
        school_id: int,
    ):
        result = await self.db.execute(
            select(
                Student,
                Classroom.name.label("classroom_name"),
                School.name.label("school_name"),
            )
            .outerjoin(
                Classroom,
                Classroom.id == Student.classroom_id,
            )
            .outerjoin(
                School,
                School.id == Student.school_id,
            )
            .where(
                Student.id == student_id,
                Student.school_id == school_id,
            )
        )

        return result.first()

    async def get_student_results(
        self,
        student_id: int,
        school_id: int,
    ):
        result = await self.db.execute(
            select(
                Result,
                Subject.id.label("subject_id"),
                Subject.name.label("subject_name"),
                Term.id.label("term_id"),
                Term.name.label("term_name"),
                AcademicSession.id.label("academic_session_id"),
                AcademicSession.name.label("academic_session_name"),
            )
            .join(
                Subject,
                Subject.id == Result.subject_id,
            )
            .join(
                Term,
                Term.id == Result.term_id,
            )
            .join(
                AcademicSession,
                AcademicSession.id == Result.academic_session_id,
            )
            .where(
                Result.student_id == student_id,
                Result.school_id == school_id,
                Result.is_active == True,
                Result.is_published == True,
            )
            .order_by(
                AcademicSession.id.asc(),
                Term.id.asc(),
                Subject.name.asc(),
                Result.id.asc(),
            )
        )

        return result.all()

    async def get_student_attendance(
        self,
        student_id: int,
        school_id: int,
    ):
        result = await self.db.execute(
            select(Attendance)
            .where(
                Attendance.student_id == student_id,
                Attendance.school_id == school_id,
            )
            .order_by(
                Attendance.attendance_date.asc(),
                Attendance.id.asc(),
            )
        )

        return result.scalars().all()

    async def get_classroom(
        self,
        classroom_id: int,
        school_id: int,
    ):
        result = await self.db.execute(
            select(
                Classroom,
                School.name.label("school_name"),
            )
            .join(
                School,
                School.id == Classroom.school_id,
            )
            .where(
                Classroom.id == classroom_id,
                Classroom.school_id == school_id,
                Classroom.is_active == True,
            )
        )

        return result.first()

    async def get_class_students(
        self,
        classroom_id: int,
        school_id: int,
    ):
        result = await self.db.execute(
            select(
                Student,
                Classroom.name.label("classroom_name"),
            )
            .join(
                Classroom,
                Classroom.id == Student.classroom_id,
            )
            .where(
                Student.school_id == school_id,
                Student.classroom_id == classroom_id,
                Student.is_active == True,
            )
            .order_by(
                Student.last_name.asc(),
                Student.first_name.asc(),
                Student.id.asc(),
            )
        )

        return result.all()

    async def get_class_results(
        self,
        classroom_id: int,
        school_id: int,
    ):
        result = await self.db.execute(
            select(
                Result,
                Student.first_name.label("first_name"),
                Student.middle_name.label("middle_name"),
                Student.last_name.label("last_name"),
                Student.admission_number.label("admission_number"),
                Subject.id.label("subject_id"),
                Subject.name.label("subject_name"),
                Term.id.label("term_id"),
                Term.name.label("term_name"),
                AcademicSession.id.label("academic_session_id"),
                AcademicSession.name.label("academic_session_name"),
            )
            .join(
                Student,
                Student.id == Result.student_id,
            )
            .join(
                Subject,
                Subject.id == Result.subject_id,
            )
            .join(
                Term,
                Term.id == Result.term_id,
            )
            .join(
                AcademicSession,
                AcademicSession.id == Result.academic_session_id,
            )
            .where(
                Result.class_id == classroom_id,
                Result.school_id == school_id,
                Result.is_active == True,
                Result.is_published == True,
            )
            .order_by(
                Result.student_id.asc(),
                AcademicSession.id.asc(),
                Term.id.asc(),
                Result.id.asc(),
            )
        )

        return result.all()

    async def get_class_attendance(
        self,
        classroom_id: int,
        school_id: int,
    ):
        result = await self.db.execute(
            select(Attendance)
            .where(
                Attendance.classroom_id == classroom_id,
                Attendance.school_id == school_id,
            )
            .order_by(
                Attendance.student_id.asc(),
                Attendance.attendance_date.asc(),
            )
        )

        return result.scalars().all()

    async def get_school(
        self,
        school_id: int,
    ):
        result = await self.db.execute(
            select(School).where(
                School.id == school_id,
            )
        )

        return result.scalar_one_or_none()

    async def get_school_students(
        self,
        school_id: int,
    ):
        result = await self.db.execute(
            select(
                Student,
                Classroom.name.label("classroom_name"),
            )
            .outerjoin(
                Classroom,
                Classroom.id == Student.classroom_id,
            )
            .where(
                Student.school_id == school_id,
                Student.is_active == True,
            )
            .order_by(
                Student.classroom_id.asc(),
                Student.last_name.asc(),
                Student.first_name.asc(),
            )
        )

        return result.all()

    async def get_school_results(
        self,
        school_id: int,
    ):
        result = await self.db.execute(
            select(
                Result,
                Student.first_name.label("first_name"),
                Student.middle_name.label("middle_name"),
                Student.last_name.label("last_name"),
                Student.admission_number.label("admission_number"),
                Student.classroom_id.label("student_classroom_id"),
                Classroom.name.label("classroom_name"),
                Subject.id.label("subject_id"),
                Subject.name.label("subject_name"),
                Term.id.label("term_id"),
                Term.name.label("term_name"),
                AcademicSession.id.label("academic_session_id"),
                AcademicSession.name.label("academic_session_name"),
            )
            .join(
                Student,
                Student.id == Result.student_id,
            )
            .outerjoin(
                Classroom,
                Classroom.id == Student.classroom_id,
            )
            .join(
                Subject,
                Subject.id == Result.subject_id,
            )
            .join(
                Term,
                Term.id == Result.term_id,
            )
            .join(
                AcademicSession,
                AcademicSession.id == Result.academic_session_id,
            )
            .where(
                Result.school_id == school_id,
                Result.is_active == True,
                Result.is_published == True,
            )
            .order_by(
                Result.class_id.asc(),
                Result.student_id.asc(),
                Result.id.asc(),
            )
        )

        return result.all()

    async def get_school_attendance(
        self,
        school_id: int,
    ):
        result = await self.db.execute(
            select(Attendance)
            .where(
                Attendance.school_id == school_id,
            )
            .order_by(
                Attendance.classroom_id.asc(),
                Attendance.student_id.asc(),
                Attendance.attendance_date.asc(),
            )
        )

        return result.scalars().all()

    async def get_school_classrooms(
        self,
        school_id: int,
    ):
        result = await self.db.execute(
            select(Classroom)
            .where(
                Classroom.school_id == school_id,
                Classroom.is_active == True,
            )
            .order_by(
                Classroom.name.asc(),
                Classroom.id.asc(),
            )
        )

        return result.scalars().all()
