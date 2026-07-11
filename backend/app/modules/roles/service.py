from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.role import Role
from app.modules.roles.repository import RoleRepository
from app.modules.roles.schemas import RoleCreateRequest


class RoleService:

    def __init__(self, db: AsyncSession):
        self.repository = RoleRepository(db)

    async def get_roles(self):
        return await self.repository.get_all()

    async def get_role(self, role_id: int):
        role = await self.repository.get_by_id(role_id)

        if role is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found",
            )

        return role

    async def create_role(self, payload: RoleCreateRequest):
        existing = await self.repository.get_by_name(payload.name)

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role already exists",
            )

        role = Role(
            name=payload.name,
            description=payload.description,
        )

        return await self.repository.create(role)
