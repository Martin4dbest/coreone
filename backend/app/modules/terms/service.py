from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.term import Term
from app.modules.terms.repository import TermRepository
from app.modules.terms.schemas import TermCreateRequest


class TermService:

    def __init__(
        self,
        db: AsyncSession
    ):
        self.repository = TermRepository(db)


    async def create_term(
        self,
        payload: TermCreateRequest
    ):

        term = Term(
            school_id=payload.school_id,
            academic_session_id=payload.academic_session_id,
            name=payload.name,
            is_current=payload.is_current,
        )

        return await self.repository.create(term)



    async def get_terms(
        self,
        school_id: int | None = None,
    ):

        return await self.repository.get_all(
            school_id
        )



    async def get_term(
        self,
        term_id: int,
    ):

        term = await self.repository.get_by_id(
            term_id
        )

        if not term:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Term not found",
            )

        return term



    async def make_current(
        self,
        term_id: int,
    ):

        term = await self.repository.get_by_id(
            term_id
        )

        if not term:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Term not found",
            )


        return await self.repository.make_current(
            term
        )
