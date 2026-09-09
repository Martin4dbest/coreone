from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.classroom import Classroom
from app.models.teacher import Teacher
from app.models.user import User
from app.models.school_feature import SchoolFeature
from app.modules.auth.dependencies.current_user import get_current_user

from .schemas import CBTQuestionRequest, CBTQuestionResponse
from .service import ai_service


router = APIRouter(
    prefix="/ai",
    tags=["AI"],
)


ALLOWED_ROLES = {
    "SUPER_ADMIN",
    "SCHOOL_ADMIN",
}


async def check_ai_access(
    db: AsyncSession,
    current_user: User,
    school_id: int,
) -> None:
    role_name = (
        current_user.role.name
        if current_user.role
        else ""
    )

    role_name = str(role_name).upper()

    # ---------------------------------------------------------
    # SCHOOL ACCESS
    # ---------------------------------------------------------
    if role_name != "SUPER_ADMIN":
        if current_user.school_id != school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this school.",
            )

    # ---------------------------------------------------------
    # FEATURE TOGGLE
    # AI is an optional, cost-bearing feature.
    # A missing AI feature record means AI is OFF.
    # ---------------------------------------------------------
    feature_result = await db.execute(
        select(SchoolFeature).where(
            SchoolFeature.school_id == school_id,
            SchoolFeature.feature_key == "ai",
        )
    )

    feature = feature_result.scalar_one_or_none()

    if not feature or feature.enabled is not True:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI Studio is disabled for this school.",
        )

    # ---------------------------------------------------------
    # SUPER ADMIN / SCHOOL ADMIN
    # ---------------------------------------------------------
    if role_name in ALLOWED_ROLES:
        return

    # ---------------------------------------------------------
    # CLASS TEACHER ONLY
    # ---------------------------------------------------------
    if role_name == "TEACHER":
        teacher_result = await db.execute(
            select(Teacher).where(
                Teacher.user_id == current_user.id,
                Teacher.school_id == school_id,
            )
        )

        teacher = teacher_result.scalar_one_or_none()

        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Teacher profile not found.",
            )

        class_result = await db.execute(
            select(Classroom.id).where(
                Classroom.school_id == school_id,
                Classroom.class_teacher_id == teacher.id,
            ).limit(1)
        )

        class_teacher_class = class_result.scalar_one_or_none()

        if class_teacher_class is not None:
            return

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI Studio is available only to Class Teachers.",
        )

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to use CoreOne AI Studio.",
    )


@router.get(
    "/access/{school_id}",
)
async def check_ai_access_endpoint(
    school_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await check_ai_access(
        db=db,
        current_user=current_user,
        school_id=school_id,
    )

    return {
        "allowed": True,
        "school_id": school_id,
    }


@router.post(
    "/cbt/generate",
    response_model=CBTQuestionResponse,
)
async def generate_cbt_questions(
    request: CBTQuestionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await check_ai_access(
        db=db,
        current_user=current_user,
        school_id=request.school_id,
    )

    try:
        return await ai_service.generate_cbt_questions(request)

    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        print("CoreOne AI generation error:", repr(exc))

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to generate AI questions.",
        ) from exc


# =========================================================
# PERFORMANCE INTELLIGENCE AI
# =========================================================

from app.core.tenant.context import TenantContext
from app.core.tenant.dependencies import get_tenant_from_request

from app.models.school_feature import SchoolFeature

from app.modules.performance_intelligence.service import (
    PerformanceIntelligenceService,
)

from .performance_service import performance_ai_service
from .schemas import PerformanceAIInsightResponse


async def check_performance_ai_access(
    db: AsyncSession,
    current_user: User,
    school_id: int,
) -> None:
    role_name = (
        current_user.role.name
        if current_user.role
        else ""
    )

    role_name = str(role_name).upper()

    # ---------------------------------------------------------
    # SCHOOL ACCESS
    # ---------------------------------------------------------

    if role_name != "SUPER_ADMIN":
        if current_user.school_id != school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this school.",
            )

    # ---------------------------------------------------------
    # AI FEATURE
    # ---------------------------------------------------------

    ai_result = await db.execute(
        select(SchoolFeature).where(
            SchoolFeature.school_id == school_id,
            SchoolFeature.feature_key == "ai",
        )
    )

    ai_feature = ai_result.scalar_one_or_none()

    if not ai_feature or ai_feature.enabled is not True:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI Studio is disabled for this school.",
        )

    # ---------------------------------------------------------
    # PERFORMANCE INTELLIGENCE FEATURE
    # ---------------------------------------------------------

    pi_result = await db.execute(
        select(SchoolFeature).where(
            SchoolFeature.school_id == school_id,
            SchoolFeature.feature_key
            == "performance_intelligence",
        )
    )

    pi_feature = pi_result.scalar_one_or_none()

    if not pi_feature or pi_feature.enabled is not True:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Performance Intelligence is disabled "
                "for this school."
            ),
        )

    # ---------------------------------------------------------
    # ROLE ACCESS
    #
    # Administrators can use school-level AI.
    # Teachers can use Performance AI where the underlying
    # Performance Intelligence endpoint permits them.
    # ---------------------------------------------------------

    if role_name in {
        "SUPER_ADMIN",
        "SCHOOL_ADMIN",
    }:
        return

    if role_name == "TEACHER":
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=(
            "You do not have permission to use "
            "Performance Intelligence AI."
        ),
    )


@router.get(
    "/performance/student/{student_id}",
    response_model=PerformanceAIInsightResponse,
)
async def generate_student_performance_ai(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(
        get_tenant_from_request
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    school_id = (
        tenant.school_id
        if current_user.role.name != "SUPER_ADMIN"
        else (
            tenant.school_id
            or current_user.school_id
        )
    )

    if school_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A school must be selected.",
        )

    await check_performance_ai_access(
        db=db,
        current_user=current_user,
        school_id=school_id,
    )

    performance_data = (
        await PerformanceIntelligenceService(
            db
        ).get_student_intelligence(
            student_id=student_id,
            current_user=current_user,
            tenant=tenant,
        )
    )

    try:
        return await performance_ai_service.generate_insight(
            scope="student",
            data=performance_data,
        )
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


@router.get(
    "/performance/class/{classroom_id}",
    response_model=PerformanceAIInsightResponse,
)
async def generate_class_performance_ai(
    classroom_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(
        get_tenant_from_request
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    school_id = (
        tenant.school_id
        if current_user.role.name != "SUPER_ADMIN"
        else (
            tenant.school_id
            or current_user.school_id
        )
    )

    if school_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A school must be selected.",
        )

    await check_performance_ai_access(
        db=db,
        current_user=current_user,
        school_id=school_id,
    )

    performance_data = (
        await PerformanceIntelligenceService(
            db
        ).get_class_intelligence(
            classroom_id=classroom_id,
            current_user=current_user,
            tenant=tenant,
        )
    )

    try:
        return await performance_ai_service.generate_insight(
            scope="class",
            data=performance_data,
        )
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


@router.get(
    "/performance/school",
    response_model=PerformanceAIInsightResponse,
)
async def generate_school_performance_ai(
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(
        get_tenant_from_request
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    school_id = (
        tenant.school_id
        if current_user.role.name != "SUPER_ADMIN"
        else (
            tenant.school_id
            or current_user.school_id
        )
    )

    if school_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A school must be selected.",
        )

    await check_performance_ai_access(
        db=db,
        current_user=current_user,
        school_id=school_id,
    )

    performance_data = (
        await PerformanceIntelligenceService(
            db
        ).get_school_intelligence(
            current_user=current_user,
            tenant=tenant,
        )
    )

    try:
        return await performance_ai_service.generate_insight(
            scope="school",
            data=performance_data,
        )
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
