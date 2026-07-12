from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_email(
        self,
        email: str,
    ):
        result = await self.db.execute(
            select(User).where(
                User.email == email
            )
        )

        return result.scalar_one_or_none()


    async def get_by_id(
        self,
        user_id: int,
    ):
        result = await self.db.execute(
            select(User).where(
                User.id == user_id
            )
        )

        return result.scalar_one_or_none()


    async def get_all(
        self,
    ):
        result = await self.db.execute(
            select(User)
        )

        return result.scalars().all()


    async def get_all_by_school(
        self,
        school_id: int,
    ):
        result = await self.db.execute(
            select(User).where(
                User.school_id == school_id
            )
        )

        return result.scalars().all()


    async def create(
        self,
        user: User,
    ):
        self.db.add(user)

        await self.db.commit()
        await self.db.refresh(user)

        return user


    async def update(
        self,
        user: User,
    ):
        await self.db.commit()
        await self.db.refresh(user)

        return user
