from fastapi import (
    APIRouter,
    Depends,
    Query,
)

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db

from app.models.user import User

from app.modules.auth.dependencies.current_user import (
    get_current_user,
)

from app.core.permissions import require_roles

from app.modules.teacher_assignments.schemas import (
    TeacherSubjectCreate,
    TeacherSubjectUpdate,
    TeacherSubjectResponse,
)

from app.modules.teacher_assignments.service import (
    TeacherAssignmentService,
)


router = APIRouter(
    prefix="/teacher-assignments",
    tags=["Teacher Assignments"],
)



@router.post(
    "",
    response_model=TeacherSubjectResponse,
)
async def assign_teacher_subject(
    payload: TeacherSubjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    require_roles(
        "SUPER_ADMIN",
        "SCHOOL_ADMIN",
    )(current_user)


    service = TeacherAssignmentService(
        db
    )


    return await service.assign_subject_teacher(
        payload,
        current_user,
    )



@router.get(
    "/teacher/{teacher_id}",
    response_model=list[TeacherSubjectResponse],
)
async def get_teacher_assignments(
    teacher_id: int,

    school_id: int | None = Query(
        default=None
    ),

    db: AsyncSession = Depends(get_db),

    current_user: User = Depends(get_current_user),
):

    service = TeacherAssignmentService(
        db
    )


    return await service.get_teacher_assignments(
        teacher_id,
        current_user,
        school_id,
    )


@router.get(
"/class/{classroom_id}",
response_model=list[TeacherSubjectResponse],
)
async def get_class_assignments(
    classroom_id: int,

    school_id: int | None = Query(
        default=None
    ),

    db: AsyncSession = Depends(get_db),

    current_user: User = Depends(get_current_user),
):

    require_roles(
        "SUPER_ADMIN",
        "SCHOOL_ADMIN",
    )(current_user)


    service = TeacherAssignmentService(
        db
    )


    return await service.get_class_assignments(
        classroom_id,
        current_user,
        school_id,
    )



@router.get(
"/school/{school_id}",
response_model=list[TeacherSubjectResponse],
)
async def get_school_assignments(
    school_id: int,

    db: AsyncSession = Depends(get_db),

    current_user: User = Depends(get_current_user),
):

    require_roles(
        "SUPER_ADMIN",
        "SCHOOL_ADMIN",
    )(current_user)


    service = TeacherAssignmentService(
        db
    )


    return await service.get_school_assignments(
        current_user,
        school_id,
    )



@router.delete(
"/{assignment_id}",
response_model=TeacherSubjectResponse,
)
async def deactivate_teacher_assignment(
    assignment_id: int,

    db: AsyncSession = Depends(get_db),

    current_user: User = Depends(get_current_user),
):

    require_roles(
        "SUPER_ADMIN",
        "SCHOOL_ADMIN",
    )(current_user)


    service = TeacherAssignmentService(
        db
    )


    return await service.deactivate_assignment(
        assignment_id,
        current_user,
    )


@router.patch(
"/{assignment_id}",
response_model=TeacherSubjectResponse,
)
async def update_teacher_assignment(
    assignment_id: int,
    payload: TeacherSubjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    require_roles(
        "SUPER_ADMIN",
        "SCHOOL_ADMIN",
    )(current_user)

    service = TeacherAssignmentService(db)

    return await service.update_assignment(
        assignment_id,
        payload,
        current_user,
    )