from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_roles
from app.db.database import get_db
from app.models.user import User
from app.modules.admins.schemas import (
    SchoolAdminCreateRequest,
    SchoolAdminResponse,
)
from app.modules.admins.service import SchoolAdminService


router = APIRouter(
    prefix="/admins",
    tags=["School Admins"],
)


@router.post(
    "",
    response_model=SchoolAdminResponse,
)
async def create_school_admin(
    payload: SchoolAdminCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN")
    ),
):
    return await SchoolAdminService(
        db
    ).create_school_admin(
        payload,
        current_user,
    )


@router.get(
    "",
    response_model=list[SchoolAdminResponse],
)
async def get_school_admins(
    school_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        )
    ),
):
    return await SchoolAdminService(
        db
    ).get_school_admins(
        current_user,
        school_id,
    )


@router.get(
    "/{admin_id}",
    response_model=SchoolAdminResponse,
)
async def get_school_admin(
    admin_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN")
    ),
):
    return await SchoolAdminService(
        db
    ).get_school_admin(
        admin_id,
        current_user,
    )

@router.delete(
    "/{admin_id}",
)
async def delete_school_admin(
    admin_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN")
    ),
):
    return await SchoolAdminService(
        db
    ).delete_school_admin(
        admin_id,
        current_user,
    )
