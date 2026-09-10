from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.academic_session import AcademicSession
from app.models.classroom import Classroom
from app.models.fee_structure import FeeStructure
from app.models.student import Student
from app.models.student_fee import StudentFee
from app.models.term import Term


class FeeRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_fee_structure(
        self,
        fee_structure: FeeStructure,
    ):
        self.db.add(fee_structure)
        await self.db.commit()

        result = await self.db.execute(
            select(FeeStructure)
            .options(selectinload(FeeStructure.items))
            .where(FeeStructure.id == fee_structure.id)
        )

        return result.scalar_one()

    async def get_fee_structures(
        self,
        school_id: int | None = None,
    ):
        query = (
            select(FeeStructure)
            .options(selectinload(FeeStructure.items))
            .order_by(FeeStructure.id.desc())
        )

        if school_id is not None:
            query = query.where(
                FeeStructure.school_id == school_id
            )

        result = await self.db.execute(query)

        return result.scalars().unique().all()

    async def get_fee_structure(
        self,
        fee_structure_id: int,
        school_id: int | None = None,
    ):
        query = (
            select(FeeStructure)
            .options(selectinload(FeeStructure.items))
            .where(FeeStructure.id == fee_structure_id)
        )

        if school_id is not None:
            query = query.where(
                FeeStructure.school_id == school_id
            )

        result = await self.db.execute(query)

        return result.scalar_one_or_none()

    async def get_academic_session(
        self,
        session_id: int,
        school_id: int,
    ):
        result = await self.db.execute(
            select(AcademicSession).where(
                AcademicSession.id == session_id,
                AcademicSession.school_id == school_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_term(
        self,
        term_id: int,
        school_id: int,
        academic_session_id: int,
    ):
        result = await self.db.execute(
            select(Term).where(
                Term.id == term_id,
                Term.school_id == school_id,
                Term.academic_session_id == academic_session_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_classroom(
        self,
        classroom_id: int,
        school_id: int,
    ):
        result = await self.db.execute(
            select(Classroom).where(
                Classroom.id == classroom_id,
                Classroom.school_id == school_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_student(
        self,
        student_id: int,
        school_id: int | None = None,
    ):
        query = select(Student).where(
            Student.id == student_id
        )

        if school_id is not None:
            query = query.where(
                Student.school_id == school_id
            )

        result = await self.db.execute(query)

        return result.scalar_one_or_none()

    async def get_students_by_classroom(
        self,
        classroom_id: int,
        school_id: int,
    ):
        result = await self.db.execute(
            select(Student).where(
                Student.classroom_id == classroom_id,
                Student.school_id == school_id,
                Student.is_active.is_(True),
            ).order_by(Student.id)
        )
        return result.scalars().all()

    async def get_students_by_ids(
        self,
        student_ids: list[int],
        school_id: int,
    ):
        if not student_ids:
            return []

        result = await self.db.execute(
            select(Student).where(
                Student.id.in_(student_ids),
                Student.school_id == school_id,
                Student.is_active.is_(True),
            ).order_by(Student.id)
        )
        return result.scalars().all()

    async def get_existing_student_fees_for_structure(
        self,
        school_id: int,
        student_ids: list[int],
        fee_structure_id: int,
    ):
        if not student_ids:
            return []

        result = await self.db.execute(
            select(StudentFee).where(
                StudentFee.school_id == school_id,
                StudentFee.student_id.in_(student_ids),
                StudentFee.fee_structure_id == fee_structure_id,
            )
        )
        return result.scalars().all()

    async def get_existing_student_fee(
        self,
        school_id: int,
        student_id: int,
        fee_structure_id: int,
    ):
        result = await self.db.execute(
            select(StudentFee).where(
                StudentFee.school_id == school_id,
                StudentFee.student_id == student_id,
                StudentFee.fee_structure_id == fee_structure_id,
            )
        )

        return result.scalar_one_or_none()

    async def create_student_fee(
        self,
        student_fee: StudentFee,
    ):
        self.db.add(student_fee)
        await self.db.commit()
        await self.db.refresh(student_fee)

        return student_fee

    async def create_student_fees(
        self,
        student_fees: list[StudentFee],
    ):
        if not student_fees:
            return []

        self.db.add_all(student_fees)
        await self.db.commit()

        for student_fee in student_fees:
            await self.db.refresh(student_fee)

        return student_fees

    async def get_student_fees(
        self,
        school_id: int | None = None,
        student_id: int | None = None,
    ):
        query = select(StudentFee).order_by(
            StudentFee.id.desc()
        )

        if school_id is not None:
            query = query.where(
                StudentFee.school_id == school_id
            )

        if student_id is not None:
            query = query.where(
                StudentFee.student_id == student_id
            )

        result = await self.db.execute(query)

        return result.scalars().all()
