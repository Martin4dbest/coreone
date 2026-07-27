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


        teacher = await self.repository.get_by_id(
            teacher_id,
            school_id,
        )


        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher not found",
            )


        assignments = await self.repository.get_teacher_assignments_summary(
            teacher_id,
            school_id,
        )


        class_teacher = await self.repository.get_class_teacher(
            teacher_id
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
