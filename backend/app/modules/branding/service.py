from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.school_branding import SchoolBranding
from app.modules.branding.repository import BrandingRepository
from app.modules.branding.schemas import (
    BrandingCreateRequest,
    BrandingUpdateRequest,
)


class BrandingService:

    def __init__(self, db: AsyncSession):
        self.repository = BrandingRepository(db)

    async def create_branding(
        self,
        payload: BrandingCreateRequest,
        current_user,
    ):
        if current_user.role.name != "SUPER_ADMIN":
            if payload.school_id != current_user.school_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You cannot create branding for another school",
                )

        existing = await self.repository.get_by_school_id(
            payload.school_id
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Branding already exists for this school",
            )

        branding = SchoolBranding(
            school_id=payload.school_id,
            logo_url=payload.logo_url,
            app_icon_url=payload.app_icon_url,
            splash_image_url=payload.splash_image_url,
            primary_color=payload.primary_color,
            secondary_color=payload.secondary_color,
            accent_color=payload.accent_color,
            motto=payload.motto,
            login_title=payload.login_title,
            login_message=payload.login_message,
            is_active=True,
        )

        return await self.repository.create(branding)

    async def get_branding(
        self,
        current_user,
        school_id: int | None = None,
    ):
        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

        if school_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="School ID is required",
            )

        branding = await self.repository.get_by_school_id(
            school_id
        )

        if not branding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Branding not found",
            )

        return branding

    async def update_branding(
        self,
        branding_id: int,
        payload: BrandingUpdateRequest,
        current_user,
    ):
        branding = await self.repository.get_by_id(
            branding_id
        )

        if not branding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Branding not found",
            )

        if current_user.role.name != "SUPER_ADMIN":
            if branding.school_id != current_user.school_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You cannot update another school's branding",
                )

        update_data = payload.model_dump(
            exclude_unset=True
        )

        for key, value in update_data.items():
            setattr(
                branding,
                key,
                value,
            )

        return await self.repository.update(branding)
