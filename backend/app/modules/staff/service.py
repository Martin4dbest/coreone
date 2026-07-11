from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.staff import Staff
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
    ):
        user = await self.user_service.create_internal_user(
            email=payload.email,
            password=payload.password,
            school_id=payload.school_id,
            role_id=payload.role_id,
        )

        staff = Staff(
            user_id=user.id,
            employee_number=payload.employee_number,
            first_name=payload.first_name,
            last_name=payload.last_name,
        )

        return await self.repository.create(staff)

    async def get_staff(self):
        return await self.repository.get_all()

    async def get_staff_member(
        self,
        staff_id: int,
    ):
        staff = await self.repository.get_by_id(staff_id)

        if not staff:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Staff not found",
            )

        return staff
