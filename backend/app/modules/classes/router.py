from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User

from app.core.tenant.context import TenantContext
from app.core.tenant.dependencies import get_tenant_from_request

from app.modules.auth.dependencies.current_user import get_current_user

from app.modules.classes.schemas import (
    ClassCreateRequest,
    ClassResponse,
    AssignClassTeacherRequest,
    ClassroomTeachersResponse,
)

from app.modules.classes.service import ClassService


router = APIRouter(
    prefix="/classes",
    tags=["Classes"],
)


@router.post(
    "",
    response_model=ClassResponse,
)
async def create_class(
    payload: ClassCreateRequest,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    return await ClassService(db).create_class(
        payload,
        tenant,
        current_user,
    )


@router.get(
    "",
    response_model=list[ClassResponse],
)
async def get_classes(
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    return await ClassService(db).get_classes(
        tenant,
        current_user,
    )


@router.get(
    "/{class_id}",
    response_model=ClassResponse,
)
async def get_class(
    class_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    return await ClassService(db).get_class(
        class_id,
        tenant,
        current_user,
    )


@router.patch("/{class_id}/deactivate")
async def deactivate_class(
    class_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    return await ClassService(db).deactivate_class(
        class_id,
        tenant,
        current_user,
    )


@router.patch("/{class_id}/activate")
async def activate_class(
    class_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    return await ClassService(db).activate_class(
        class_id,
        tenant,
        current_user,
    )


@router.delete("/{class_id}")
async def delete_class(
    class_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    return await ClassService(db).delete_class(
        class_id,
        tenant,
        current_user,
    )


@router.post(
    "/{class_id}/class-teacher",
)
async def assign_class_teacher(
    class_id: int,
    payload: AssignClassTeacherRequest,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    return await ClassService(db).assign_class_teacher(
        class_id,
        payload.teacher_id,
        tenant,
        current_user,
    )


@router.delete(
    "/{class_id}/class-teacher",
)
async def remove_class_teacher(
    class_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    return await ClassService(db).remove_class_teacher(
        class_id,
        tenant,
        current_user,
    )


@router.get(
    "/{class_id}/teachers",
    response_model=ClassroomTeachersResponse,
)
async def get_class_teachers(
    class_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    return await ClassService(db).get_class_teachers(
        class_id,
        tenant,
        current_user,
    )
