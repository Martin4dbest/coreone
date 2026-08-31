from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.role import Role
from app.models.user import User


class SchoolAdminRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(
        self,
        school_id: int | None = None,
    ):
        query = (
            select(User)
            .join(Role, User.role_id == Role.id)
            .options(
                selectinload(User.role),
                selectinload(User.school),
            )
            .where(
                Role.name == "SCHOOL_ADMIN"
            )
            .order_by(User.id)
        )

        if school_id is not None:
            query = query.where(
                User.school_id == school_id
            )

        result = await self.db.execute(query)

        admins = result.scalars().all()

        for admin in admins:
            admin.school_name = (
                admin.school.name
                if admin.school
                else None
            )
            admin.school_code = (
                admin.school.school_code
                if admin.school
                else None
            )

        return admins

    async def get_by_id(
        self,
        admin_id: int,
    ):
        result = await self.db.execute(
            select(User)
            .join(Role, User.role_id == Role.id)
            .options(
                selectinload(User.role),
                selectinload(User.school),
            )
            .where(
                User.id == admin_id,
                Role.name == "SCHOOL_ADMIN",
            )
        )

        admin = result.scalar_one_or_none()

        if admin and admin.school:
            admin.school_name = admin.school.name
            admin.school_code = admin.school.school_code

        return admin

    async def update(
        self,
        admin: User,
    ):
        await self.db.commit()
        await self.db.refresh(admin)

        return admin

    async def delete(
        self,
        admin: User,
    ):
        await self.db.delete(admin)
        await self.db.commit()
