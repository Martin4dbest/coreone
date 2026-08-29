from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.attendance import Attendance
from app.models.parent import Parent
from app.models.parent_student import ParentStudent
from app.models.parent_school import ParentSchool
from app.models.school import School
from app.models.classroom import Classroom
from app.models.school_branding import SchoolBranding
from app.models.student import Student
from app.models.user import User


class ParentRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(
        self,
        school_id: int | None = None,
    ):
        query = select(Parent)

        if school_id is not None:
            query = (
                query
                .join(
                    ParentSchool,
                    ParentSchool.parent_id == Parent.id,
                )
                .where(
                    ParentSchool.school_id == school_id
                )
            )

        query = query.order_by(
            Parent.first_name.asc(),
            Parent.last_name.asc(),
            Parent.id.asc(),
        )

        result = await self.db.execute(query)

        return result.scalars().unique().all()

    async def get_by_id(
        self,
        parent_id: int,
        school_id: int | None = None,
    ):
        query = select(Parent).where(
            Parent.id == parent_id
        )

        if school_id is not None:
            query = (
                query
                .join(
                    ParentSchool,
                    ParentSchool.parent_id == Parent.id,
                )
                .where(
                    ParentSchool.school_id == school_id
                )
            )

        result = await self.db.execute(query)

        return result.scalar_one_or_none()

    async def get_by_user_id(
        self,
        user_id: int,
    ):
        result = await self.db.execute(
            select(Parent).where(
                Parent.user_id == user_id
            )
        )

        return result.scalar_one_or_none()

    async def get_by_email(
        self,
        email: str,
    ):
        result = await self.db.execute(
            select(Parent)
            .join(Parent.user)
            .where(User.email == email)
        )

        return result.scalar_one_or_none()

    async def get_students_for_parent(
        self,
        parent_id: int,
    ):
        query = (
            select(
                ParentStudent,
                Student,
                School,
                SchoolBranding,
                Classroom.name.label("class_name"),
            )
            .join(
                Student,
                ParentStudent.student_id == Student.id,
            )
            .join(
                School,
                Student.school_id == School.id,
            )
            .outerjoin(
                Classroom,
                Classroom.id == Student.classroom_id,
            )
            .outerjoin(
                SchoolBranding,
                SchoolBranding.school_id == School.id,
            )
            .where(
                ParentStudent.parent_id == parent_id
            )
            .order_by(
                Student.first_name,
                Student.last_name,
            )
        )

        result = await self.db.execute(query)

        return result.all()

    async def get_students_for_parent_in_school(
        self,
        parent_id: int,
        school_id: int,
    ):
        query = (
            select(
                ParentStudent,
                Student,
                School,
                SchoolBranding,
                Classroom.name.label("class_name"),
            )
            .join(
                Student,
                ParentStudent.student_id == Student.id,
            )
            .join(
                School,
                Student.school_id == School.id,
            )
            .outerjoin(
                Classroom,
                Classroom.id == Student.classroom_id,
            )
            .outerjoin(
                SchoolBranding,
                SchoolBranding.school_id == School.id,
            )
            .where(
                ParentStudent.parent_id == parent_id,
                Student.school_id == school_id,
            )
            .order_by(
                Student.first_name,
                Student.last_name,
            )
        )

        result = await self.db.execute(query)

        return result.all()


    async def get_attendance_for_student(
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
                Attendance.attendance_date.desc()
            )
        )

        return result.scalars().all()

    async def get_student_for_parent(
        self,
        parent_id: int,
        student_id: int,
    ):
        query = (
            select(
                ParentStudent,
                Student,
                School,
                SchoolBranding,
                Classroom.name.label("class_name"),
            )
            .join(
                Student,
                ParentStudent.student_id == Student.id,
            )
            .join(
                School,
                Student.school_id == School.id,
            )
            .outerjoin(
                Classroom,
                Classroom.id == Student.classroom_id,
            )
            .outerjoin(
                SchoolBranding,
                SchoolBranding.school_id == School.id,
            )
            .where(
                ParentStudent.parent_id == parent_id,
                ParentStudent.student_id == student_id,
            )
        )

        result = await self.db.execute(query)

        return result.first()

    async def get_student_link(
        self,
        parent_id: int,
        student_id: int,
    ):
        result = await self.db.execute(
            select(ParentStudent).where(
                ParentStudent.parent_id == parent_id,
                ParentStudent.student_id == student_id,
            )
        )

        return result.scalar_one_or_none()

    async def create_student_link(
        self,
        parent_student: ParentStudent,
    ):
        self.db.add(parent_student)

        await self.db.commit()
        await self.db.refresh(parent_student)

        return parent_student

    async def delete_student_link(
        self,
        parent_student: ParentStudent,
    ):
        await self.db.delete(parent_student)
        await self.db.commit()

    async def create(
        self,
        parent: Parent,
    ):
        self.db.add(parent)

        await self.db.commit()
        await self.db.refresh(parent)

        return parent
