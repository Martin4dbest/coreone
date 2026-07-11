from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.houses.schemas import (
    HouseCreateRequest,
    HouseResponse,
)
from app.modules.houses.service import HouseService


router = APIRouter(
    prefix="/houses",
    tags=["Houses"],
)


@router.post(
    "",
    response_model=HouseResponse,
)
async def create_house(
    payload: HouseCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await HouseService(db).create_house(payload)


@router.get(
    "",
    response_model=list[HouseResponse],
)
async def get_houses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await HouseService(db).get_houses()


@router.get(
    "/{house_id}",
    response_model=HouseResponse,
)
async def get_house(
    house_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await HouseService(db).get_house(house_id)
