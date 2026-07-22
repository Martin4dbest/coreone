from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.school import School
from app.modules.schools.repository import SchoolRepository
from app.modules.schools.schemas import SchoolCreateRequest


class SchoolService:

    def __init__(self, db: AsyncSession):
        self.repository = SchoolRepository(db)

    async def create_school(
        self,
        payload: SchoolCreateRequest,
    ):
        existing = await self.repository.get_by_code(
            payload.school_code
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="School code already exists",
            )

        school = School(
            name=payload.name,
            school_code=payload.school_code,
            email=payload.email,
            phone=payload.phone,
            address=payload.address,
            city=payload.city,
            state=payload.state,
            country=payload.country,
        )

        return await self.repository.create(school)

    async def get_schools(self):
        return await self.repository.get_all()

    async def get_school(
        self,
        school_id: int,
    ):
        school = await self.repository.get_by_id(school_id)

        if school is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="School not found",
            )

        return school

    async def deactivate_school(
        self,
        school_id: int,
    ):
        school = await self.repository.get_by_id(school_id)

        if not school:
            raise HTTPException(
                status_code=404,
                detail="School not found",
            )

        school.is_active = False

        return await self.repository.update(school)

    async def activate_school(
        self,
        school_id: int,
    ):
        school = await self.repository.get_by_id(school_id)

        if not school:
            raise HTTPException(
                status_code=404,
                detail="School not found",
            )

        school.is_active = True

        return await self.repository.update(school)

    async def delete_school(
        self,
        school_id: int,
        current_user,
    ):
        if (
            not current_user.role
            or current_user.role.name != "SUPER_ADMIN"
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Super Admin can delete a school",
            )

        school = await self.repository.get_by_id(school_id)

        if not school:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="School not found",
            )

        # Protection check for system school
        if (
            school.school_code.upper() == "SYSTEM"
            or school.name.lower() == "presense"
            or getattr(school, "is_system", False)
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="The PreSense system school cannot be deleted.",
            )

        school_name = school.name

        try:
            await self.repository.delete(school)
        except Exception:
            await self.repository.db.rollback()
            raise

        return {
            "message": f"School '{school_name}' deleted successfully"
        }