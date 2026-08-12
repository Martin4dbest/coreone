from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.partner_school import PartnerSchool
from app.models.student import Student
from app.models.student_partner_school import StudentPartnerSchool
from app.modules.partner_schools.repository import PartnerSchoolRepository


class PartnerSchoolService:
    def __init__(self, db):
        self.db = db
        self.repository = PartnerSchoolRepository(db)

    async def _school_id(self, current_user, school_id: int):
        if current_user.role.name == "SUPER_ADMIN":
            return school_id

        if current_user.role.name != "SCHOOL_ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only School Admin can manage Partner Schools.",
            )

        if current_user.school_id != school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot access another school.",
            )

        return current_user.school_id

    async def list_partner_schools(
        self,
        school_id: int,
        current_user,
    ):
        await self._school_id(current_user, school_id)

        rows = await self.repository.get_all(school_id)

        return [
            {
                "id": partner.id,
                "school_id": partner.school_id,
                "name": partner.name,
                "student_count": count,
            }
            for partner, count in rows
        ]

    async def create_partner_school(
        self,
        school_id: int,
        name: str,
        current_user,
    ):
        await self._school_id(current_user, school_id)

        name = name.strip()

        if not name:
            raise HTTPException(
                status_code=400,
                detail="Partner school name is required.",
            )

        existing = await self.db.execute(
            select(PartnerSchool).where(
                PartnerSchool.school_id == school_id,
                PartnerSchool.name.ilike(name),
            )
        )

        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="Partner school already exists.",
            )

        return await self.repository.create(
            PartnerSchool(
                school_id=school_id,
                name=name,
            )
        )

    async def get_students(
        self,
        school_id: int,
        partner_school_id: int,
        current_user,
        search: str | None = None,
        class_id: int | None = None,
    ):
        await self._school_id(current_user, school_id)

        partner = await self.repository.get(
            partner_school_id,
            school_id,
        )

        if not partner:
            raise HTTPException(
                status_code=404,
                detail="Partner school not found.",
            )

        students, associated_ids = await self.repository.get_students(
            school_id,
            partner_school_id,
            search,
            class_id,
        )

        return [
            {
                "id": student.id,
                "admission_number": student.admission_number,
                "first_name": student.first_name,
                "last_name": student.last_name,
                "middle_name": student.middle_name,
                "classroom_id": student.classroom_id,
                "classroom_name": (
                    student.classroom.name
                    if student.classroom
                    else None
                ),
                "is_associated": student.id in associated_ids,
            }
            for student in students
        ]

    async def associate_students(
        self,
        school_id: int,
        partner_school_id: int,
        student_ids: list[int],
        current_user,
    ):
        await self._school_id(current_user, school_id)

        partner = await self.repository.get(
            partner_school_id,
            school_id,
        )

        if not partner:
            raise HTTPException(
                status_code=404,
                detail="Partner school not found.",
            )

        await self.repository.associate(
            student_ids,
            partner_school_id,
            school_id,
        )

        return {
            "success": True,
            "associated_count": len(student_ids),
        }

    async def remove_student(
        self,
        school_id: int,
        partner_school_id: int,
        student_id: int,
        current_user,
    ):
        await self._school_id(current_user, school_id)

        await self.repository.remove(
            student_id,
            partner_school_id,
            school_id,
        )

        return {"success": True}

    async def get_student_partner_schools(
        self,
        student_id: int,
        school_id: int,
    ):
        result = await self.db.execute(
            select(PartnerSchool)
            .join(
                StudentPartnerSchool,
                StudentPartnerSchool.partner_school_id
                == PartnerSchool.id,
            )
            .where(
                StudentPartnerSchool.student_id == student_id,
                PartnerSchool.school_id == school_id,
            )
            .order_by(PartnerSchool.name)
        )

        return result.scalars().all()
