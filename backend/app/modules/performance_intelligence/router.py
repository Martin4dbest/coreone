from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.core.tenant.context import TenantContext
from app.core.tenant.dependencies import get_tenant_from_request
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user

from app.modules.performance_intelligence.schemas import (
    ClassPerformanceIntelligenceResponse,
    SchoolPerformanceIntelligenceResponse,
    StudentPerformanceIntelligenceResponse,
)
from app.modules.performance_intelligence.service import (
    PerformanceIntelligenceService,
)


router = APIRouter(
    prefix="/performance-intelligence",
    tags=["Performance Intelligence"],
)


@router.get(
    "/student/{student_id}",
    response_model=StudentPerformanceIntelligenceResponse,
    status_code=status.HTTP_200_OK,
)
async def get_student_performance_intelligence(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    return await PerformanceIntelligenceService(
        db
    ).get_student_intelligence(
        student_id=student_id,
        current_user=current_user,
        tenant=tenant,
    )


@router.get(
    "/class/{classroom_id}",
    response_model=ClassPerformanceIntelligenceResponse,
    status_code=status.HTTP_200_OK,
)
async def get_class_performance_intelligence(
    classroom_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    return await PerformanceIntelligenceService(
        db
    ).get_class_intelligence(
        classroom_id=classroom_id,
        current_user=current_user,
        tenant=tenant,
    )


@router.get(
    "/school",
    response_model=SchoolPerformanceIntelligenceResponse,
    status_code=status.HTTP_200_OK,
)
async def get_school_performance_intelligence(
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    return await PerformanceIntelligenceService(
        db
    ).get_school_intelligence(
        current_user=current_user,
        tenant=tenant,
    )
