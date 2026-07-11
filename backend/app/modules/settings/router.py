from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.settings.schemas import (
    SettingCreateRequest,
    SettingResponse,
)
from app.modules.settings.service import SettingService


router = APIRouter(
    prefix="/settings",
    tags=["Settings"],
)


@router.post(
    "",
    response_model=SettingResponse,
)
async def create_setting(
    payload: SettingCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await SettingService(db).create_setting(
        payload,
        current_user,
    )


@router.get(
    "",
    response_model=list[SettingResponse],
)
async def get_settings(
    school_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await SettingService(db).get_settings(
        current_user,
        school_id,
    )


@router.get(
    "/{setting_id}",
    response_model=SettingResponse,
)
async def get_setting(
    setting_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await SettingService(db).get_setting(
        setting_id,
        current_user,
    )
