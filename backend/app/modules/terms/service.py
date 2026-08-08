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
        payload: TermCreateRequest,
        current_user,
    ):

        if current_user.role.name != "SUPER_ADMIN":

            if payload.school_id != current_user.school_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You cannot create terms for another school",
                )


        term = Term(
            school_id=payload.school_id,
            academic_session_id=payload.academic_session_id,
            name=payload.name,
            is_current=payload.is_current,
        )

        return await self.repository.create(term)



    async def get_terms(
        self,
        current_user,
        school_id: int | None = None,
    ):

        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

        return await self.repository.get_all(
            school_id
        )



    async def get_term(
        self,
        term_id: int,
        current_user,
    ):

        school_id = None

        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id


        term = await self.repository.get_by_id(
            term_id,
            school_id,
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
        current_user,
    ):

        school_id = None

        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id


        term = await self.repository.get_by_id(
            term_id,
            school_id,
        )


        if not term:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Term not found",
            )

        return await self.repository.make_current(term)


    async def delete_term(
        self,
        term_id: int,
        current_user,
    ):
        term = await self.repository.get_by_id(term_id)

        if not term:
            raise HTTPException(
                status_code=404,
                detail="Term not found",
            )

        if (
            current_user.role.name != "SUPER_ADMIN"
            and term.school_id != current_user.school_id
        ):
            raise HTTPException(
                status_code=403,
                detail="Unauthorized school access",
            )

        await self.repository.delete(term)

        return {
            "message": "Term deleted successfully"
        }