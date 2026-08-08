from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user

from app.modules.terms.schemas import (
    TermCreateRequest,
    TermResponse,
)

from app.modules.terms.service import TermService


router = APIRouter(
    prefix="/terms",
    tags=["Terms"],
)


@router.post(
    "",
    response_model=TermResponse
)
async def create_term(
    payload: TermCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TermService(db).create_term(
        payload,
        current_user,
    )



@router.get(
    "",
    response_model=list[TermResponse]
)
async def get_terms(
    school_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TermService(db).get_terms(
        current_user,
        school_id,
    )



@router.get(
    "/{term_id}",
    response_model=TermResponse
)
async def get_term(
    term_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TermService(db).get_term(
        term_id,
        current_user,
    )



@router.patch(
    "/{term_id}/make-current",
    response_model=TermResponse
)
async def make_current(
    term_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return await TermService(db).make_current(
        term_id,
        current_user,
    )



@router.delete("/{term_id}")
async def delete_term(
    term_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TermService(db).delete_term(
        term_id,
        current_user,
    )