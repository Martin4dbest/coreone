from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.term import Term


class TermRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(
            select(Term)
        )
        return result.scalars().all()

    async def get_by_id(self, term_id: int):
        result = await self.db.execute(
            select(Term).where(Term.id == term_id)
        )
        return result.scalar_one_or_none()

    async def create(self, term: Term):
        self.db.add(term)
        await self.db.commit()
        await self.db.refresh(term)
        return term
