from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.role import Role
from app.models.user import User


class SuperAdminRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(
            select(User)
            .join(Role, User.role_id == Role.id)
            .options(
                selectinload(User.role),
                selectinload(User.school),
            )
            .where(Role.name == "SUPER_ADMIN")
            .order_by(User.id)
        )

        return result.scalars().all()

    async def get_by_id(self, admin_id: int):
        result = await self.db.execute(
            select(User)
            .join(Role, User.role_id == Role.id)
            .options(
                selectinload(User.role),
                selectinload(User.school),
            )
            .where(
                User.id == admin_id,
                Role.name == "SUPER_ADMIN",
            )
        )

        return result.scalar_one_or_none()

    async def update(self, admin: User):
        await self.db.commit()
        await self.db.refresh(admin)

        return admin