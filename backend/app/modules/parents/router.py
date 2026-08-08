from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_roles
from app.db.database import get_db
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.parents.schemas import (
    ParentCreateRequest,
    ParentResponse,
)
from app.modules.parents.service import ParentService

router = APIRouter(
    prefix="/parents",
    tags=["Parents"],
)


@router.get(
    "",
    response_model=list[ParentResponse],
)
async def get_parents(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")),
):
    service = ParentService(db)
    return await service.get_parents(
        current_user
    )


@router.get(
    "/{parent_id}",
    response_model=ParentResponse,
)
async def get_parent(
    parent_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")),
):
    service = ParentService(db)
    return await service.get_parent(
        parent_id,
        current_user
    )


@router.post(
    "",
    response_model=ParentResponse,
)
async def create_parent(
    payload: ParentCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")),
):
    service = ParentService(db)
    return await service.create_parent(
        payload,
        current_user
    )