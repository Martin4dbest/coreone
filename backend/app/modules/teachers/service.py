from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.teacher import Teacher
from app.modules.teachers.repository import TeacherRepository
from app.modules.teachers.schemas import TeacherCreateRequest
from app.modules.users.service import UserService


class TeacherService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = TeacherRepository(db)

    async def get_teachers(self):
        return await self.repository.get_all()

    async def get_teacher(
        self,
        teacher_id: int,
    ):
        teacher = await self.repository.get_by_id(
            teacher_id
        )

        if not teacher:
            raise HTTPException(
                status_code=404,
                detail="Teacher not found",
            )

        return teacher

    async def create_teacher(
        self,
        payload: TeacherCreateRequest,
    ):
        user_service = UserService(self.db)

        user = await user_service.create_internal_user(
            email=payload.email,
            password=payload.password,
            school_id=payload.school_id,
            role_id=payload.role_id,
        )

        teacher = Teacher(
            user_id=user.id,
            employee_number=payload.employee_number,
            first_name=payload.first_name,
            last_name=payload.last_name,
        )

        return await self.repository.create(
            teacher
        )
