from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.staff import Staff
from app.models.role import Role
from app.modules.staff.repository import StaffRepository
from app.modules.staff.schemas import StaffCreateRequest
from app.modules.users.service import UserService


class StaffService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = StaffRepository(db)
        self.user_service = UserService(db)

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

    async def get_staff(
        self,
        current_user,
    ):
        school_id = None

        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

        return await self.repository.get_all(
            school_id
        )

    async def get_staff_member(
        self,
        staff_id: int,
        current_user,
    ):
        school_id = None

        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

        staff = await self.repository.get_by_id(
            staff_id,
            school_id,
        )

        if not staff:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Staff not found",
            )

        return staff