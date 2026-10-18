from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_roles
from app.core.tenant.context import TenantContext
from app.core.tenant.dependencies import get_tenant_from_request
from app.db.database import get_db
from app.modules.student_engagement.service import StudentEngagementService

router = APIRouter(
    prefix="/student-engagement",
    tags=["Student Performance & Engagement"],
)


@router.get("/school")
async def get_school_rankings(
    classroom_id: int | None = Query(default=None, ge=1),
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user=Depends(require_roles("SCHOOL_ADMIN", "SUPER_ADMIN")),
):
    return await StudentEngagementService(db).school_rankings(
        current_user, tenant, classroom_id
    )


@router.get("/me")
async def get_my_rankings(
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user=Depends(require_roles("STUDENT")),
):
    return await StudentEngagementService(db).student_view(
        current_user, tenant
    )


@router.get("/parent/students/{student_id}")
async def get_child_rankings(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user=Depends(require_roles("PARENT")),
):
    return await StudentEngagementService(db).parent_view(
        current_user, tenant, student_id
    )
