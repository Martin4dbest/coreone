from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.modules.roles.repository import RoleRepository
from app.modules.schools.repository import SchoolRepository
from app.modules.users.service import UserService
from app.modules.super_admins.repository import SuperAdminRepository
from app.modules.super_admins.schemas import SuperAdminCreateRequest


class SuperAdminService:

    def __init__(self, db: AsyncSession):
        self.repository = SuperAdminRepository(db)
        self.role_repository = RoleRepository(db)
        self.school_repository = SchoolRepository(db)
        self.user_service = UserService(db)

    async def create_super_admin(
        self,
        payload: SuperAdminCreateRequest,
        current_user: User,
    ):
        role = await self.role_repository.get_by_name(
            "SUPER_ADMIN"
        )

        if role is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="SUPER_ADMIN role not configured",
            )

        school = await self.school_repository.get_by_code(
            "SYSTEM"
        )

        if school is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="PreSense system school not configured",
            )

        return await self.user_service.create_internal_user(
            email=payload.email,
            password=payload.password,
            school_id=school.id,
            role_id=role.id,
        )

    async def get_super_admins(
        self,
        current_user: User,
    ):
        return await self.repository.get_all()

    async def update_status(
        self,
        admin_id: int,
        is_active: bool,
        current_user: User,
    ):
        admin = await self.repository.get_by_id(admin_id)

        if admin is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Super Admin not found",
            )

        if admin.id == current_user.id and not is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot deactivate your own Super Admin account",
            )

        admin.is_active = is_active

        return await self.repository.update(admin)
