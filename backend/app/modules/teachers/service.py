from fastapi import HTTPException, status
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.role import Role
from app.models.teacher import Teacher
from app.models.staff import Staff
from app.models.user import User
from app.modules.teachers.repository import TeacherRepository
from app.modules.teachers.schemas import (
    TeacherCreateRequest,
    LinkableStaffResponse,
)
from app.modules.users.service import UserService


class TeacherService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = TeacherRepository(db)

    async def get_teachers(
        self,
        tenant,
        current_user,
        requested_school_id: int | None = None,
    ):
        if (
            current_user.role.name == "SUPER_ADMIN"
            and requested_school_id is not None
        ):
            school_id = requested_school_id
        else:
            school_id = tenant.school_id

        return await self.repository.get_all(
            school_id
        )

    async def get_teacher(
        self,
        teacher_id: int,
        tenant,
        current_user,
        requested_school_id=None,
    ):

        if (
            current_user.role.name == "SUPER_ADMIN"
            and requested_school_id
        ):
            school_id = requested_school_id
        else:
            school_id = tenant.school_id

        teacher = await self.repository.get_by_id(
            teacher_id,
            school_id,
        )

        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher not found",
            )

        return teacher

    async def get_linkable_staff(
        self,
        tenant,
        current_user,
        requested_school_id: int | None = None,
    ):
        if (
            current_user.role.name == "SUPER_ADMIN"
            and requested_school_id is not None
        ):
            school_id = requested_school_id
        else:
            school_id = tenant.school_id

        result = await self.db.execute(
            select(Staff)
            .options(
                selectinload(Staff.user),
            )
            .join(
                Staff.user,
            )
            .outerjoin(
                Teacher,
                Teacher.user_id == Staff.user_id,
            )
            .where(
                Staff.user.has(school_id=school_id),
                Teacher.id.is_(None),
            )
            .order_by(
                Staff.first_name,
                Staff.last_name,
            )
        )

        staff_members = result.scalars().all()

        return [
            LinkableStaffResponse(
                id=staff.id,
                user_id=staff.user_id,
                employee_number=staff.employee_number,
                first_name=staff.first_name,
                last_name=staff.last_name,
                email=staff.user.email if staff.user else "",
                is_active=staff.is_active,
            )
            for staff in staff_members
        ]

    async def link_staff_to_teacher(
        self,
        staff_id: int,
        tenant,
        current_user,
        requested_school_id: int | None = None,
    ):
        if (
            current_user.role.name == "SUPER_ADMIN"
            and requested_school_id is not None
        ):
            school_id = requested_school_id
        else:
            school_id = tenant.school_id

        result = await self.db.execute(
            select(Staff)
            .options(
                selectinload(Staff.user),
                selectinload(Staff.user, User.teacher),
            )
            .join(
                Staff.user,
            )
            .where(
                Staff.id == staff_id,
                Staff.user.has(school_id=school_id),
            )
        )

        staff = result.scalar_one_or_none()

        if not staff:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Staff member not found in this school",
            )

        if not staff.user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Staff member is not linked to a valid user account",
            )

        if staff.user.teacher is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This staff member is already linked to a teacher profile",
            )

        existing_teacher = await self.db.execute(
            select(Teacher).where(
                Teacher.employee_number == staff.employee_number,
            )
        )

        if existing_teacher.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "This employee number already exists in the teacher records"
                ),
            )

        teacher = Teacher(
            user_id=staff.user_id,
            school_id=school_id,
            employee_number=staff.employee_number,
            first_name=staff.first_name,
            last_name=staff.last_name,
        )

        return await self.repository.create(teacher)

    async def create_teacher(
        self,
        payload: TeacherCreateRequest,
        tenant,
        current_user,
    ):
        if (
            current_user.role.name == "SUPER_ADMIN"
            and payload.school_id is not None
        ):
            school_id = payload.school_id
        else:
            school_id = tenant.school_id

        result = await self.db.execute(
            select(Role).where(
                Role.name == "TEACHER"
            )
        )

        teacher_role = result.scalar_one_or_none()

        if not teacher_role:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="TEACHER role not configured",
            )

        user_service = UserService(self.db)

        user = await user_service.create_internal_user(
            email=payload.email,
            password=payload.password,
            school_id=school_id,
            role_id=teacher_role.id,
        )

        teacher = Teacher(
            user_id=user.id,
            school_id=school_id,
            employee_number=payload.employee_number,
            first_name=payload.first_name,
            last_name=payload.last_name,
        )

        return await self.repository.create(teacher)

    async def get_teacher_assignments_summary(
        self,
        teacher_id: int,
        tenant,
        current_user,
        requested_school_id=None,
    ):

        if (
            current_user.role.name == "SUPER_ADMIN"
            and requested_school_id
        ):
            school_id = requested_school_id
        else:
            school_id = tenant.school_id


        # --------------------------------------------------------
        # COREONE COMPATIBILITY:
        # The Registered Users screen may provide either:
        #   1. Teacher.id
        #   2. User.id belonging to the teacher
        #
        # Resolve the canonical Teacher profile ID first.
        # This keeps the existing API contract intact while fixing
        # the "Teacher not found" error caused by ID mismatch.
        # --------------------------------------------------------

        teacher_query = await self.db.execute(
            select(Teacher)
            .options(
                selectinload(Teacher.user),
            )
            .where(
                Teacher.id == teacher_id,
                Teacher.school_id == school_id,
            )
        )

        teacher = teacher_query.scalar_one_or_none()

        if teacher is None:
            teacher_query = await self.db.execute(
                select(Teacher)
                .options(
                    selectinload(Teacher.user),
                )
                .where(
                    Teacher.user_id == teacher_id,
                    Teacher.school_id == school_id,
                )
            )

            teacher = teacher_query.scalar_one_or_none()

        if teacher is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher not found",
            )

        canonical_teacher_id = teacher.id

        assignments = (
            await self.repository.get_teacher_assignments_summary(
                canonical_teacher_id,
                school_id,
            )
        )

        class_teachers = await self.repository.get_class_teacher(
            canonical_teacher_id,
            school_id,
        )


        return {
            "teacher": (
                teacher.first_name
                + " "
                + teacher.last_name
            ),

            "email": (
                teacher.user.email
                if teacher.user
                else None
            ),

            "class_teacher_of": [
                classroom.name
                for classroom in class_teachers
                if classroom.name
            ],

            "subjects": [
                {
                    "id": assignment.id,

                    "classroom": (
                        assignment.classroom.name
                        if assignment.classroom
                        else ""
                    ),

                    "subject": (
                        assignment.subject.name
                        if assignment.subject
                        else ""
                    ),
                }

                for assignment in assignments
            ],
        }


    async def delete_teacher(
        self,
        teacher_id: int,
        tenant,
        current_user,
        requested_school_id=None,
    ):
        if (
            current_user.role.name == "SUPER_ADMIN"
            and requested_school_id
        ):
            school_id = requested_school_id
        else:
            school_id = tenant.school_id

        teacher = await self.repository.get_by_id(
            teacher_id,
            school_id,
        )

        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher not found",
            )

        await self.repository.delete(teacher)

        return {
            "message": "Teacher deleted successfully"
        }
