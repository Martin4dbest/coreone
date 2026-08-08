from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_roles
from app.db.database import get_db
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.schools.schemas import (
    SchoolCreateRequest,
    SchoolResponse,
)
from app.modules.schools.service import SchoolService
from app.models.school_branding import SchoolBranding
from sqlalchemy import select


router = APIRouter(
    prefix="/schools",
    tags=["Schools"],
)


@router.post(
    "",
    response_model=SchoolResponse,
)
async def create_school(
    payload: SchoolCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles("SUPER_ADMIN")),
):
    service = SchoolService(db)
    return await service.create_school(payload)


@router.get(
    "",
    response_model=list[SchoolResponse],
)
async def get_schools(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles("SUPER_ADMIN")),
):
    service = SchoolService(db)
    return await service.get_schools()


@router.get(
    "/me",
    response_model=SchoolResponse,
)
async def get_my_school(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not current_user.school_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not assigned to a school",
        )

    service = SchoolService(db)
    school = await service.get_school(
        current_user.school_id
    )

    branding_result = await db.execute(
        select(SchoolBranding).where(
            SchoolBranding.school_id == school.id
        )
    )

    branding = branding_result.scalar_one_or_none()

    if branding:
        school.logo_url = branding.logo_url
        school.motto = branding.motto
        school.primary_color = branding.primary_color
        school.secondary_color = branding.secondary_color

    return school


@router.get(
    "/by-slug/{slug}",
    response_model=SchoolResponse,
)
async def get_school_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    service = SchoolService(db)

    school = await service.get_school_by_slug(slug)

    branding_result = await db.execute(
        select(SchoolBranding).where(
            SchoolBranding.school_id == school.id
        )
    )

    branding = branding_result.scalar_one_or_none()

    if branding:
        school.logo_url = branding.logo_url
        school.motto = branding.motto
        school.primary_color = branding.primary_color
        school.secondary_color = branding.secondary_color

    return school


@router.get(
    "/{school_id}",
    response_model=SchoolResponse,
)
async def get_school(
    school_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    role_name = (
        current_user.role.name
        if current_user.role
        else None
    )

    if role_name == "SUPER_ADMIN":
        pass

    elif role_name == "SCHOOL_ADMIN":
        if current_user.school_id != school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot access another school",
            )

    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this school",
        )

    print(">>> GET SCHOOL ROUTE CALLED:", school_id)

    service = SchoolService(db)
    school = await service.get_school(school_id)

    print(">>> RETURNING:", school.id, school.name)

    return school


@router.patch("/{school_id}/deactivate")
async def deactivate_school(
    school_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles("SUPER_ADMIN")),
):
    return await SchoolService(db).deactivate_school(
        school_id
    )


@router.patch("/{school_id}/activate")
async def activate_school(
    school_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles("SUPER_ADMIN")),
):
    return await SchoolService(db).activate_school(
        school_id
    )


@router.delete("/{school_id}")
async def delete_school(
    school_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles("SUPER_ADMIN")),
):
    return await SchoolService(db).delete_school(
        school_id,
        current_user,
    )