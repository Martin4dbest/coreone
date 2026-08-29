from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.role import Role
from app.models.teacher import Teacher
from app.modules.teachers.repository import TeacherRepository
from app.modules.teachers.schemas import TeacherCreateRequest
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
            select(Teacher).where(
                Teacher.id == teacher_id,
                Teacher.school_id == school_id,
            )
        )

        teacher = teacher_query.scalar_one_or_none()

        if teacher is None:
            teacher_query = await self.db.execute(
                select(Teacher).where(
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

        class_teacher = await self.repository.get_class_teacher(
            canonical_teacher_id
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

            "class_teacher_of": (
                [
                    class_teacher.name
                ]
                if class_teacher
                else []
            ),

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