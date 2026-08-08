from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.term import Term


class TermRepository:

    def __init__(
        self,
        db: AsyncSession
    ):
        self.db = db


    async def get_all(
        self,
        school_id: int | None = None,
    ):

        query = select(Term)

        if school_id is not None:
            query = query.where(
                Term.school_id == school_id
            )

        result = await self.db.execute(query)

        return result.scalars().all()



    async def get_by_id(
        self,
        term_id: int,
        school_id: int | None = None,
    ):

        query = select(Term).where(
            Term.id == term_id
        )


        if school_id is not None:
            query = query.where(
                Term.school_id == school_id
            )


        result = await self.db.execute(query)

        return result.scalar_one_or_none()



    async def create(
        self,
        term: Term,
    ):

        self.db.add(term)

        await self.db.commit()

        await self.db.refresh(term)

        return term



    async def clear_current_terms(
        self,
        school_id: int,
    ):

        result = await self.db.execute(
            select(Term).where(
                Term.school_id == school_id,
                Term.is_current == True
            )
        )

        terms = result.scalars().all()


        for term in terms:
            term.is_current = False


        await self.db.commit()



    async def make_current(
        self,
        term: Term,
    ):

        await self.clear_current_terms(
            term.school_id
        )

        term.is_current = True

        await self.db.commit()

        await self.db.refresh(term)

        return term


    async def delete(
        self,
        term,
    ):
        await self.db.delete(term)

        await self.db.commit()