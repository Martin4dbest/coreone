from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.role import Role


class RoleRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(
            select(Role).order_by(Role.id)
        )
        return result.scalars().all()

    async def get_by_id(
        self,
        role_id: int,
    ):
        result = await self.db.execute(
            select(Role).where(
                Role.id == role_id
            )
        )
        return result.scalar_one_or_none()

    async def get_by_name(
        self,
        name: str,
    ):
        result = await self.db.execute(
            select(Role).where(
                Role.name == name
            )
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        role: Role,
    ):
        self.db.add(role)
        await self.db.commit()
        await self.db.refresh(role)
        return role
