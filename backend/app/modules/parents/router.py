from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_roles
from app.db.database import get_db
from app.modules.parents.schemas import (
    ParentCreateRequest,
    ParentExistingStudentLinkRequest,
    ParentDetailsResponse,
    ParentMeResponse,
    ParentResponse,
    ParentStudentLinkRequest,
    ParentStudentResponse,
)
from app.modules.parents.service import ParentService


router = APIRouter(
    prefix="/parents",
    tags=["Parents"],
)


# ============================================================
# ADMIN PARENT ENDPOINTS
# ============================================================

@router.get(
    "",
    response_model=list[ParentResponse],
)
async def get_parents(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(
        require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")
    ),
):
    return await ParentService(db).get_parents(
        current_user
    )


@router.post(
    "",
    response_model=ParentResponse,
)
async def create_parent(
    payload: ParentCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(
        require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")
    ),
):
    return await ParentService(db).create_parent(
        payload,
        current_user,
    )


# ============================================================
# PARENT SELF-SERVICE ENDPOINTS
# ============================================================

@router.get(
    "/me",
    response_model=ParentMeResponse,
)
async def get_my_parent_profile(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(
        require_roles("PARENT")
    ),
):
    return await ParentService(db).get_current_parent(
        current_user
    )


@router.get(
    "/me/students",
    response_model=list[ParentStudentResponse],
)
async def get_my_students(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(
        require_roles("PARENT")
    ),
):
    return await ParentService(db).get_my_students(
        current_user
    )


@router.get(
    "/me/students/{student_id}/attendance",
)
async def get_my_student_attendance(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(
        require_roles("PARENT")
    ),
):
    return await ParentService(db).get_my_student_attendance(
        student_id,
        current_user,
    )


@router.get(
    "/me/students/{student_id}/results",
)
async def get_my_student_results(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(
        require_roles("PARENT")
    ),
):
    return await ParentService(db).get_my_student_results(
        student_id,
        current_user,
    )


@router.get(
    "/me/students/{student_id}",
    response_model=ParentStudentResponse,
)
async def get_my_student(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(
        require_roles("PARENT")
    ),
):
    return await ParentService(db).get_my_student(
        student_id,
        current_user,
    )


# ============================================================
# ADMIN PARENT DETAILS
# ============================================================

@router.get(
    "/{parent_id}/details",
    response_model=ParentDetailsResponse,
)
async def get_parent_details(
    parent_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        )
    ),
):
    service = ParentService(db)

    return await service.get_parent_details(
        parent_id,
        current_user,
    )


# ============================================================
# ADMIN PARENT/STUDENT RELATIONSHIP MANAGEMENT
# ============================================================

@router.post(
    "/link-existing",
    response_model=ParentStudentResponse,
)
async def link_existing_parent(
    payload: ParentExistingStudentLinkRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(
        require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")
    ),
):
    return await ParentService(db).link_existing_parent_by_email(
        payload.email,
        payload.student_id,
        payload.relationship_type,
        current_user,
    )


@router.post(
    "/{parent_id}/students/{student_id}",
    response_model=ParentStudentResponse,
)
async def link_parent_student(
    parent_id: int,
    student_id: int,
    payload: ParentStudentLinkRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(
        require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")
    ),
):
    return await ParentService(db).link_student(
        parent_id,
        student_id,
        payload.relationship_type,
        current_user,
    )


@router.delete(
    "/{parent_id}/students/{student_id}",
)
async def unlink_parent_student(
    parent_id: int,
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(
        require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")
    ),
):
    return await ParentService(db).unlink_student(
        parent_id,
        student_id,
        current_user,
    )


# ============================================================
# ADMIN SINGLE-PARENT LOOKUP
# ============================================================

@router.get(
    "/{parent_id}",
    response_model=ParentResponse,
)
async def get_parent(
    parent_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(
        require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")
    ),
):
    return await ParentService(db).get_parent(
        parent_id,
        current_user,
    )
