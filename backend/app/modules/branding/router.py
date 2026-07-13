from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.branding.schemas import (
    BrandingCreateRequest,
    BrandingUpdateRequest,
    BrandingResponse,
)
from app.modules.branding.service import BrandingService


router = APIRouter(
    prefix="/branding",
    tags=["Branding"],
)


@router.post(
    "",
    response_model=BrandingResponse,
)
async def create_branding(
    payload: BrandingCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await BrandingService(db).create_branding(
        payload,
        current_user,
    )


@router.get(
    "",
    response_model=BrandingResponse,
)
async def get_branding(
    school_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await BrandingService(db).get_branding(
        current_user,
        school_id,
    )


@router.put(
    "/{branding_id}",
    response_model=BrandingResponse,
)
async def update_branding(
    branding_id: int,
    payload: BrandingUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await BrandingService(db).update_branding(
        branding_id,
        payload,
        current_user,
    )
