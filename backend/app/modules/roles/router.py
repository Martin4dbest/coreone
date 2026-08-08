from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_roles
from app.db.database import get_db
from app.models.user import User
from app.modules.roles.schemas import (
    RoleCreateRequest,
    RoleResponse,
)
from app.modules.roles.service import RoleService


router = APIRouter(
    prefix="/roles",
    tags=["Roles"],
)


@router.get(
    "",
    response_model=list[RoleResponse],
)
async def get_roles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        )
    ),
):
    service = RoleService(db)
    return await service.get_roles()


@router.get(
    "/{role_id}",
    response_model=RoleResponse,
)
async def get_role(
    role_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        )
    ),
):
    service = RoleService(db)
    return await service.get_role(role_id)


@router.post(
    "",
    response_model=RoleResponse,
)
async def create_role(
    payload: RoleCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN")
    ),
):
    service = RoleService(db)
    return await service.create_role(payload)