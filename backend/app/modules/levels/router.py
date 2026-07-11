from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.levels.schemas import (
    LevelCreateRequest,
    LevelResponse,
)
from app.modules.levels.service import LevelService


router = APIRouter(
    prefix="/levels",
    tags=["Levels"],
)


@router.post(
    "",
    response_model=LevelResponse,
)
async def create_level(
    payload: LevelCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await LevelService(db).create_level(
        payload,
        current_user,
    )


@router.get(
    "",
    response_model=list[LevelResponse],
)
async def get_levels(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await LevelService(db).get_levels(
        current_user
    )


@router.get(
    "/{level_id}",
    response_model=LevelResponse,
)
async def get_level(
    level_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await LevelService(db).get_level(
        level_id,
        current_user,
    )

@router.patch("/{level_id}/deactivate")
async def deactivate_level(
    level_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await LevelService(db).deactivate_level(
        level_id
    )


@router.patch("/{level_id}/activate")
async def activate_level(
    level_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await LevelService(db).activate_level(
        level_id
    )

