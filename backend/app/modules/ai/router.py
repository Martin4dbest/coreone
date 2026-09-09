from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.classroom import Classroom
from app.models.teacher import Teacher
from app.models.user import User
from app.models.school_feature import SchoolFeature
from app.modules.auth.dependencies.current_user import get_current_user

from .schemas import (
    AICBTAccessGenerateRequest,
    AICBTAccessGenerateResponse,
    AICBTAccessRedeemRequest,
    AICBTAccessRedeemResponse,
    AICBTAccessStatusResponse,
    CBTQuestionRequest,
    CBTQuestionResponse,
)
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
    # TEACHER
    #
    # Class Teachers have direct access.
    # Other teachers require a redeemed AI CBT access grant.
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
                Classroom.is_active.is_(True),
            ).limit(1)
        )

        if class_result.scalar_one_or_none() is not None:
            return

        access_service = AICBTTeacherAccessService(db)

        if await access_service.has_granted_access(
            current_user
        ):
            return

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI_CBT_PASSCODE_REQUIRED",
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


@router.get("/config-status")
async def ai_config_status(
    current_user: User = Depends(get_current_user),
):
    return {
        "mock_mode": settings.AI_MOCK_MODE,
        "primary_provider": settings.AI_PRIMARY_PROVIDER,
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "gemini_model": settings.GEMINI_AI_MODEL,
        "gemini_fallback_models": settings.GEMINI_AI_FALLBACK_MODELS,
        "openai_configured": bool(settings.OPENAI_API_KEY),
        "openai_fallback_enabled": settings.AI_ENABLE_OPENAI_FALLBACK,
    }


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
from .cbt_access_service import AICBTTeacherAccessService


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


# =========================================================
# AI CBT TEACHER ACCESS
# =========================================================

@router.get(
    "/cbt/access/status/{school_id}",
    response_model=AICBTAccessStatusResponse,
)
async def ai_cbt_access_status(
    school_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role_name = (
        current_user.role.name
        if current_user.role
        else ""
    )
    role_name = str(role_name).upper()

    if role_name == "SUPER_ADMIN":
        return {
            "allowed": True,
            "reason": "super_admin",
        }

    if current_user.school_id != school_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this school.",
        )

    # AI feature must still be enabled.
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

    if role_name == "SCHOOL_ADMIN":
        return {
            "allowed": True,
            "reason": "school_admin",
        }

    if role_name != "TEACHER":
        return {
            "allowed": False,
            "reason": "role_not_allowed",
        }

    teacher_result = await db.execute(
        select(Teacher).where(
            Teacher.user_id == current_user.id,
            Teacher.school_id == school_id,
        )
    )

    teacher = teacher_result.scalar_one_or_none()

    if not teacher:
        return {
            "allowed": False,
            "reason": "teacher_profile_missing",
        }

    class_teacher_result = await db.execute(
        select(Classroom.id).where(
            Classroom.school_id == school_id,
            Classroom.class_teacher_id == teacher.id,
            Classroom.is_active.is_(True),
        ).limit(1)
    )

    if class_teacher_result.scalar_one_or_none() is not None:
        return {
            "allowed": True,
            "reason": "class_teacher",
        }

    access_service = AICBTTeacherAccessService(db)

    if await access_service.has_granted_access(current_user):
        return {
            "allowed": True,
            "reason": "delegated_access",
        }

    return {
        "allowed": False,
        "reason": "passcode_required",
    }


@router.post(
    "/cbt/access/generate",
    response_model=AICBTAccessGenerateResponse,
)
async def generate_ai_cbt_teacher_access(
    request: AICBTAccessGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        role_name = ""

        if getattr(current_user, "role_id", None):
            from app.models.role import Role

            role_result = await db.execute(
                select(Role.name).where(
                    Role.id == current_user.role_id
                )
            )
            role_name = str(
                role_result.scalar_one_or_none() or ""
            ).upper()

        if role_name != "TEACHER":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Only a class teacher can generate "
                    "AI CBT teacher access codes."
                ),
            )

        service = AICBTTeacherAccessService(db)

        return await service.generate_code(
            classroom_id=request.classroom_id,
            target_teacher_id=request.target_teacher_id,
            current_user=current_user,
        )

    except HTTPException:
        raise

    except Exception as exc:
        print(
            "AI CBT access code generation error:",
            repr(exc),
        )
        await db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to generate the AI CBT passcode.",
        ) from exc


@router.post(
    "/cbt/access/redeem",
    response_model=AICBTAccessRedeemResponse,
)
async def redeem_ai_cbt_teacher_access(
    request: AICBTAccessRedeemRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role_name = (
        current_user.role.name
        if current_user.role
        else ""
    )
    role_name = str(role_name).upper()

    if role_name != "TEACHER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teacher access only.",
        )

    return await AICBTTeacherAccessService(db).redeem_code(
        code=request.code,
        current_user=current_user,
    )
