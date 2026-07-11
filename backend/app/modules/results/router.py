from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.results.schemas import (
    ResultCreateRequest,
    ResultResponse,
)
from app.modules.results.service import ResultService


router = APIRouter(
    prefix="/results",
    tags=["Results"],
)


@router.post(
    "",
    response_model=ResultResponse,
)
async def create_result(
    payload: ResultCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ResultService(db).create_result(
        payload
    )


@router.get(
    "",
    response_model=list[ResultResponse],
)
async def get_results(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ResultService(db).get_results()


@router.get(
    "/{result_id}",
    response_model=ResultResponse,
)
async def get_result(
    result_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ResultService(db).get_result(
        result_id
    )
