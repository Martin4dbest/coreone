from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_roles
from app.db.database import get_db
from app.models.user import User
from app.modules.super_admins.schemas import (
    SuperAdminCreateRequest,
    SuperAdminResponse,
)
from app.modules.super_admins.service import SuperAdminService


router = APIRouter(
    prefix="/super-admins",
    tags=["Super Admins"],
)


@router.post(
    "",
    response_model=SuperAdminResponse,
)
async def create_super_admin(
    payload: SuperAdminCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN")
    ),
):
    return await SuperAdminService(
        db
    ).create_super_admin(
        payload,
        current_user,
    )


@router.get(
    "",
    response_model=list[SuperAdminResponse],
)
async def get_super_admins(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN")
    ),
):
    return await SuperAdminService(
        db
    ).get_super_admins(
        current_user,
    )


@router.patch(
    "/{admin_id}/activate",
    response_model=SuperAdminResponse,
)
async def activate_super_admin(
    admin_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN")
    ),
):
    return await SuperAdminService(
        db
    ).update_status(
        admin_id,
        True,
        current_user,
    )


@router.patch(
    "/{admin_id}/deactivate",
    response_model=SuperAdminResponse,
)
async def deactivate_super_admin(
    admin_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN")
    ),
):
    return await SuperAdminService(
        db
    ).update_status(
        admin_id,
        False,
        current_user,
    )