from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.parent import Parent


class ParentRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(
            select(Parent).order_by(Parent.id)
        )
        return result.scalars().all()

    async def get_by_id(self, parent_id: int):
        result = await self.db.execute(
            select(Parent).where(
                Parent.id == parent_id
            )
        )
        return result.scalar_one_or_none()

    async def create(self, parent: Parent):
        self.db.add(parent)
        await self.db.commit()
        await self.db.refresh(parent)
        return parent
