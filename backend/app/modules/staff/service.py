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
            last_name=payload.last_name,
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

        if payload.last_name is not None:
            staff.last_name = payload.last_name

        if payload.email is not None:
            staff.user.email = str(payload.email)

        await self.db.commit()
        await self.db.refresh(staff)

        return staff

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
