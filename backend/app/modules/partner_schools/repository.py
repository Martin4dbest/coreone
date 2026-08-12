from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.partner_school import PartnerSchool
from app.models.student import Student
from app.models.student_partner_school import StudentPartnerSchool


class PartnerSchoolRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, school_id: int):
        result = await self.db.execute(
            select(
                PartnerSchool,
                func.count(StudentPartnerSchool.id).label("student_count"),
            )
            .outerjoin(
                StudentPartnerSchool,
                StudentPartnerSchool.partner_school_id == PartnerSchool.id,
            )
            .where(PartnerSchool.school_id == school_id)
            .group_by(PartnerSchool.id)
            .order_by(PartnerSchool.name)
        )

        return result.all()

    async def get(self, partner_school_id: int, school_id: int):
        result = await self.db.execute(
            select(PartnerSchool)
            .where(
                PartnerSchool.id == partner_school_id,
                PartnerSchool.school_id == school_id,
            )
        )

        return result.scalar_one_or_none()

    async def create(self, partner_school: PartnerSchool):
        self.db.add(partner_school)
        await self.db.commit()
        await self.db.refresh(partner_school)
        return partner_school

    async def get_students(
        self,
        school_id: int,
        partner_school_id: int,
        search: str | None = None,
        class_id: int | None = None,
    ):
        query = (
            select(Student)
            .options(
                selectinload(Student.classroom),
            )
            .where(Student.school_id == school_id)
            .order_by(Student.first_name, Student.last_name)
        )

        if search:
            term = f"%{search.strip()}%"
            query = query.where(
                (
                    Student.first_name.ilike(term)
                    | Student.last_name.ilike(term)
                    | Student.middle_name.ilike(term)
                    | Student.admission_number.ilike(term)
                )
            )

        if class_id is not None:
            query = query.where(
                Student.classroom_id == class_id
            )

        result = await self.db.execute(query)
        students = result.scalars().all()

        links_result = await self.db.execute(
            select(StudentPartnerSchool.student_id).where(
                StudentPartnerSchool.partner_school_id
                == partner_school_id
            )
        )

        associated_ids = {
            row[0] for row in links_result.all()
        }

        return students, associated_ids

    async def associate(
        self,
        student_ids: list[int],
        partner_school_id: int,
        school_id: int,
    ):
        if not student_ids:
            return

        students_result = await self.db.execute(
            select(Student.id).where(
                Student.id.in_(student_ids),
                Student.school_id == school_id,
            )
        )

        valid_student_ids = {
            row[0] for row in students_result.all()
        }

        existing_result = await self.db.execute(
            select(StudentPartnerSchool.student_id).where(
                StudentPartnerSchool.partner_school_id
                == partner_school_id,
                StudentPartnerSchool.student_id.in_(
                    valid_student_ids
                ),
            )
        )

        existing_ids = {
            row[0] for row in existing_result.all()
        }

        for student_id in valid_student_ids - existing_ids:
            self.db.add(
                StudentPartnerSchool(
                    student_id=student_id,
                    partner_school_id=partner_school_id,
                )
            )

        await self.db.commit()

    async def remove(
        self,
        student_id: int,
        partner_school_id: int,
        school_id: int,
    ):
        result = await self.db.execute(
            select(StudentPartnerSchool)
            .join(
                Student,
                Student.id == StudentPartnerSchool.student_id,
            )
            .where(
                StudentPartnerSchool.student_id == student_id,
                StudentPartnerSchool.partner_school_id
                == partner_school_id,
                Student.school_id == school_id,
            )
        )

        link = result.scalar_one_or_none()

        if link:
            await self.db.delete(link)
            await self.db.commit()
