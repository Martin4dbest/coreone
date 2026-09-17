from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.staff import Staff
from app.models.role import Role
from app.modules.staff.repository import StaffRepository
from app.modules.staff.schemas import (
    StaffCreateRequest,
    StaffUpdateRequest,
)
from app.modules.users.service import UserService


class StaffService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = StaffRepository(db)
        self.user_service = UserService(db)

    def _school_id(self, current_user):
        if current_user.role.name == "SUPER_ADMIN":
            return None

        return current_user.school_id

    async def create_staff(
        self,
        payload: StaffCreateRequest,
        current_user,
    ):
        if (
            current_user.role.name != "SUPER_ADMIN"
            and payload.school_id != current_user.school_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot create staff for another school",
            )

        existing_staff = await self.repository.get_by_employee_number(
            payload.employee_number
        )

        if existing_staff:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Employee number already exists",
            )

        result = await self.db.execute(
            select(Role).where(
                Role.name == "STAFF"
            )
        )

        staff_role = result.scalar_one_or_none()

        if not staff_role:
            raise HTTPException(
                status_code=500,
                detail="STAFF role not configured",
            )

        user = await self.user_service.create_internal_user(
            email=payload.email,
            password=payload.password,
            school_id=payload.school_id,
            role_id=staff_role.id,
        )

        staff = Staff(
            user_id=user.id,
            employee_number=payload.employee_number,
            first_name=payload.first_name,
            middle_name=payload.middle_name,
            last_name=payload.last_name,
            gender=payload.gender,
            date_of_birth=payload.date_of_birth,
            phone=payload.phone,
            address=payload.address,
            job_title=payload.job_title,
            department=payload.department,
            employment_type=payload.employment_type,
            date_employed=payload.date_employed,
            qualification=payload.qualification,
            emergency_contact_name=payload.emergency_contact_name,
            emergency_contact_relationship=payload.emergency_contact_relationship,
            emergency_contact_phone=payload.emergency_contact_phone,
            profile_photo=payload.profile_photo,
            notes=payload.notes,
        )

        return await self.repository.create(staff)

    async def get_my_profile(
        self,
        current_user,
    ):
        if current_user.role.name != "STAFF":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Staff access required",
            )

        staff = await self.repository.get_by_user_id(
            current_user.id
        )

        if not staff:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Staff profile not found",
            )

        return staff

    async def get_staff(
        self,
        current_user,
    ):
        return await self.repository.get_all(
            self._school_id(current_user)
        )

    async def get_staff_member(
        self,
        staff_id: int,
        current_user,
    ):
        staff = await self.repository.get_by_id(
            staff_id,
            self._school_id(current_user),
        )

        if not staff:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Staff not found",
            )

        return staff

    async def update_staff(
        self,
        staff_id: int,
        payload: StaffUpdateRequest,
        current_user,
    ):
        staff = await self.get_staff_member(
            staff_id,
            current_user,
        )

        if payload.employee_number is not None:
            existing = await self.repository.get_by_employee_number(
                payload.employee_number
            )

            if existing and existing.id != staff.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Employee number already exists",
                )

            staff.employee_number = payload.employee_number

        if payload.first_name is not None:
            staff.first_name = payload.first_name

        if payload.middle_name is not None:
            staff.middle_name = payload.middle_name

        if payload.last_name is not None:
            staff.last_name = payload.last_name

        if payload.gender is not None:
            staff.gender = payload.gender

        if payload.date_of_birth is not None:
            staff.date_of_birth = payload.date_of_birth

        if payload.phone is not None:
            staff.phone = payload.phone

        if payload.address is not None:
            staff.address = payload.address

        if payload.job_title is not None:
            staff.job_title = payload.job_title

        if payload.department is not None:
            staff.department = payload.department

        if payload.employment_type is not None:
            staff.employment_type = payload.employment_type

        if payload.date_employed is not None:
            staff.date_employed = payload.date_employed

        if payload.qualification is not None:
            staff.qualification = payload.qualification

        if payload.emergency_contact_name is not None:
            staff.emergency_contact_name = payload.emergency_contact_name

        if payload.emergency_contact_relationship is not None:
            staff.emergency_contact_relationship = payload.emergency_contact_relationship

        if payload.emergency_contact_phone is not None:
            staff.emergency_contact_phone = payload.emergency_contact_phone

        if payload.profile_photo is not None:
            staff.profile_photo = payload.profile_photo

        if payload.notes is not None:
            staff.notes = payload.notes

        if payload.email is not None:
            staff.user.email = str(payload.email)

        await self.db.commit()
        await self.db.refresh(staff)

        return staff

    async def delete_staff(
        self,
        staff_id: int,
        current_user,
    ):
        staff = await self.get_staff_member(
            staff_id,
            current_user,
        )

        user = staff.user

        await self.db.delete(staff)
        await self.db.flush()

        if user:
            await self.db.delete(user)

        await self.db.commit()


    async def set_staff_status(
        self,
        staff_id: int,
        is_active: bool,
        current_user,
    ):
        staff = await self.get_staff_member(
            staff_id,
            current_user,
        )

        staff.user.is_active = is_active

        await self.db.commit()
        await self.db.refresh(staff)

        return staff
