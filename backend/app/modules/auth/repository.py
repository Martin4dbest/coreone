from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User


class AuthRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_by_email(
        self,
        email: str,
        school_id: int | None = None,
    ) -> User | None:

        stmt = (
            select(User)
            .options(
                selectinload(User.role)
            )
            .where(User.email == email)
        )

        if school_id is not None:
            stmt = stmt.where(User.school_id == school_id)

        result = await self.db.execute(stmt)

        return result.scalar_one_or_none()

    async def get_user_by_id(
        self,
        user_id: int,
    ) -> User | None:

        result = await self.db.execute(
            select(User)
            .options(
                selectinload(User.role)
            )
            .where(User.id == user_id)
        )

        return result.scalar_one_or_none()

    async def update_user(
        self,
        user: User,
    ) -> User:

        await self.db.commit()
        await self.db.refresh(user)

        return user
