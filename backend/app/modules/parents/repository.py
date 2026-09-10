from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.attendance import Attendance
from app.models.academic_session import AcademicSession
from app.models.fee_structure import FeeStructure, FeeStructureItem
from app.models.payment import Payment
from app.models.student_fee import StudentFee
from app.models.term import Term
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

    async def get_student_fees_for_parent(
        self,
        parent_id: int,
        student_id: int,
    ):
        """
        Return the existing StudentFee invoices for a student,
        but only when the student is linked to the parent.
        """

        link_result = await self.db.execute(
            select(ParentStudent).where(
                ParentStudent.parent_id == parent_id,
                ParentStudent.student_id == student_id,
            )
        )

        parent_link = link_result.scalar_one_or_none()

        if parent_link is None:
            return None, []

        student_result = await self.db.execute(
            select(Student).where(
                Student.id == student_id
            )
        )

        student = student_result.scalar_one_or_none()

        if student is None:
            return None, []

        invoice_result = await self.db.execute(
            select(StudentFee)
            .where(
                StudentFee.student_id == student_id,
                StudentFee.school_id == student.school_id,
            )
            .order_by(StudentFee.id.desc())
        )

        invoices = invoice_result.scalars().all()

        return student, invoices

    async def get_fee_structure_items(
        self,
        fee_structure_id: int,
    ):
        result = await self.db.execute(
            select(FeeStructureItem)
            .where(
                FeeStructureItem.fee_structure_id == fee_structure_id
            )
            .order_by(FeeStructureItem.id.asc())
        )

        return result.scalars().all()

    async def get_fee_structure_academic_info(
        self,
        fee_structure_id: int,
    ):
        result = await self.db.execute(
            select(
                FeeStructure,
                AcademicSession,
                Term,
            )
            .join(
                AcademicSession,
                AcademicSession.id == FeeStructure.academic_session_id,
            )
            .join(
                Term,
                Term.id == FeeStructure.term_id,
            )
            .where(
                FeeStructure.id == fee_structure_id
            )
        )

        return result.first()

    async def get_payments_for_student_fee(
        self,
        student_fee_id: int,
    ):
        result = await self.db.execute(
            select(Payment)
            .where(
                Payment.student_fee_id == student_fee_id
            )
            .order_by(Payment.id.desc())
        )

        return result.scalars().all()

    async def create(
        self,
        parent: Parent,
    ):
        self.db.add(parent)

        await self.db.commit()
        await self.db.refresh(parent)

        return parent
