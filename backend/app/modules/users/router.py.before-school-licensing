from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select

from app.db.database import get_db
from app.models.user import User
from app.models.role import Role
from app.models.teacher import Teacher
from app.models.student import Student
from app.models.parent import Parent
from app.models.staff import Staff
from app.core.permissions import require_roles
from app.modules.users.schemas import (
    UserCreateRequest,
    UserResponse,
    UserStatusUpdate,
)
from app.modules.users.service import UserService


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.post(
    "",
    response_model=UserResponse,
)
async def create_user(
    payload: UserCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        )
    ),
):
    service = UserService(db)

    return await service.create_user(
        payload,
        current_user,
    )


@router.get(
    "",
    response_model=list[UserResponse],
)
async def get_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        )
    ),
):
    service = UserService(db)

    return await service.get_users(
        current_user
    )



@router.get(
    "/licensing-summary",
)
async def get_licensing_summary(
    school_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN")
    ),
):
    """
    Super Admin-only licensing statistics.

    Licensing hierarchy:

    - The platform has one global/main SUPER_ADMIN controller.
    - For each school, the first registered admin is the
      school's Super Admin / primary admin.
    - Additional admins in that school are ordinary Admins.
    - Teachers, students, parents and staff are counted by school.

    This endpoint intentionally does not depend on tenant resolution.
    """

    # ---------------------------------------------------------
    # SCHOOL SUPER ADMIN / PRIMARY ADMIN
    #
    # The first registered admin belonging to this school is the
    # school's Super Admin. We calculate this from existing data
    # without changing the database.
    #
    # Both legacy SUPER_ADMIN and SCHOOL_ADMIN records are included
    # as admin candidates because older school records may have used
    # the SUPER_ADMIN role for the first school administrator.
    # ---------------------------------------------------------
    school_admins_result = await db.execute(
        select(User)
        .join(Role, User.role_id == Role.id)
        .where(
            User.school_id == school_id,
            User.is_active == True,
            Role.name.in_(["SUPER_ADMIN", "SCHOOL_ADMIN"]),
        )
        .order_by(
            User.created_at.asc(),
            User.id.asc(),
        )
    )

    school_admins = list(
        school_admins_result.scalars().all()
    )

    super_admin_count = 1 if school_admins else 0

    # Every admin registered after the first school admin is an
    # ordinary admin for licensing purposes.
    admin_count = max(
        len(school_admins) - 1,
        0,
    )

    # ---------------------------------------------------------
    # TEACHERS
    # ---------------------------------------------------------
    teacher_result = await db.execute(
        select(func.count(Teacher.id))
        .where(
            Teacher.school_id == school_id,
        )
    )

    teacher_count = int(
        teacher_result.scalar() or 0
    )

    # ---------------------------------------------------------
    # STUDENTS
    # ---------------------------------------------------------
    student_result = await db.execute(
        select(func.count(Student.id))
        .where(
            Student.school_id == school_id,
        )
    )

    student_count = int(
        student_result.scalar() or 0
    )

    # ---------------------------------------------------------
    # PARENTS
    #
    # parents does not have school_id. The school is obtained
    # through the parent's linked user.
    # ---------------------------------------------------------
    parent_result = await db.execute(
        select(func.count(Parent.id))
        .join(User, Parent.user_id == User.id)
        .where(
            User.school_id == school_id,
        )
    )

    parent_count = int(
        parent_result.scalar() or 0
    )

    # ---------------------------------------------------------
    # STAFF
    #
    # staff does not have school_id. The school is obtained
    # through the staff member's linked user.
    # ---------------------------------------------------------
    staff_result = await db.execute(
        select(func.count(Staff.id))
        .join(User, Staff.user_id == User.id)
        .where(
            User.school_id == school_id,
        )
    )

    staff_count = int(
        staff_result.scalar() or 0
    )

    return {
        "super_admin": super_admin_count,
        "admin": admin_count,
        "teacher": teacher_count,
        "student": student_count,
        "parent": parent_count,
        "staff": staff_count,
    }


@router.get(
    "/{user_id}",
    response_model=UserResponse,
)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        )
    ),
):
    service = UserService(db)

    return await service.get_user(
        user_id,
        current_user,
    )


@router.patch(
    "/{user_id}/status",
    response_model=UserResponse,
)
async def update_status(
    user_id: int,
    payload: UserStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        )
    ),
):
    service = UserService(db)

    return await service.update_status(
        user_id,
        payload,
        current_user,
    )