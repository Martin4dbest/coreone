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
        current_user,
        requested_school_id: int | None = None,
    ):
        if current_user.role.name == "SUPER_ADMIN":
            school_id = requested_school_id
        else:
            school_id = current_user.school_id

        return await self.repository.get_all(
            school_id
        )

    async def get_teacher(
        self,
        teacher_id: int,
        current_user,
    ):
        school_id = None

        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

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
        current_user,
    ):
        if (
            current_user.role.name != "SUPER_ADMIN"
            and payload.school_id != current_user.school_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot create teachers for another school",
            )

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
            school_id=payload.school_id,
            role_id=teacher_role.id,
        )

        teacher = Teacher(
            user_id=user.id,
            employee_number=payload.employee_number,
            first_name=payload.first_name,
            last_name=payload.last_name,
        )

        return await self.repository.create(teacher)
