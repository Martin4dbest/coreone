from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.parent import Parent
from app.models.user import User


class ParentRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(
        self,
        school_id: int | None = None,
    ):
        query = select(Parent).order_by(Parent.id)

        if school_id is not None:
            query = (
                query
                .join(Parent.user)
                .where(User.school_id == school_id)
            )

        result = await self.db.execute(query)

        return result.scalars().all()

    async def get_by_id(
        self,
        parent_id: int,
        school_id: int | None = None,
    ):
        query = select(Parent).where(
            Parent.id == parent_id
        )

        if school_id is not None:
            query = (
                query
                .join(Parent.user)
                .where(User.school_id == school_id)
            )

        result = await self.db.execute(query)

        return result.scalar_one_or_none()

    async def create(self, parent: Parent):
        self.db.add(parent)
        await self.db.commit()
        await self.db.refresh(parent)
        return parent
