from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile
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
from app.modules.branding.upload import save_branding_image


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

@router.post("/upload-image")
async def upload_branding_image(
    request: Request,
    school_id: int = Form(...),
    asset_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    allowed_asset_types = {
        "logo",
        "app-icon",
        "splash",
    }

    if asset_type not in allowed_asset_types:
        raise HTTPException(
            status_code=400,
            detail="Invalid branding asset type.",
        )

    if current_user.role.name != "SUPER_ADMIN":
        if school_id != current_user.school_id:
            raise HTTPException(
                status_code=403,
                detail="You cannot upload branding for another school.",
            )

    image_url = await save_branding_image(
        file=file,
        school_id=school_id,
        asset_type=asset_type,
    )

    absolute_image_url = str(
        request.base_url
    ).rstrip("/") + image_url

    return {
        "url": absolute_image_url,
    }