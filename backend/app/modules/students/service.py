from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.classroom import Classroom
from app.models.role import Role
from app.models.student import Student

from app.modules.students.repository import StudentRepository
from app.modules.students.schemas import StudentCreateRequest
from app.modules.users.service import UserService


class StudentService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = StudentRepository(db)
        self.user_service = UserService(db)

    async def create_student(
        self,
        payload: StudentCreateRequest,
        current_user,
    ):
        school_id = payload.school_id

        if current_user.role.name != "SUPER_ADMIN":
            if school_id != current_user.school_id:
                raise HTTPException(
                    status_code=403,
                    detail="You cannot create students for another school",
                )

        classroom = None

        if payload.classroom_id is not None:
            result = await self.db.execute(
                select(Classroom).where(
                    Classroom.id == payload.classroom_id,
                    Classroom.school_id == school_id,
                )
            )

            classroom = result.scalar_one_or_none()

            if not classroom:
                raise HTTPException(
                    status_code=400,
                    detail="Selected class does not belong to this school",
                )

        existing = await self.repository.get_by_admission_number(
            payload.admission_number,
            school_id,
        )

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Admission number already exists",
            )

        result = await self.db.execute(
            select(Role).where(
                Role.name == "STUDENT",
            )
        )

        student_role = result.scalar_one_or_none()

        if not student_role:
            raise HTTPException(
                status_code=500,
                detail="STUDENT role not configured",
            )

        user = await self.user_service.create_internal_user(
            email=payload.email,
            password=payload.password,
            school_id=school_id,
            role_id=student_role.id,
        )

        student = Student(
            user_id=user.id,
            school_id=school_id,
            admission_number=payload.admission_number,
            first_name=payload.first_name,
            last_name=payload.last_name,
            middle_name=payload.middle_name,
            gender=payload.gender,
            date_of_birth=payload.date_of_birth,
            passport=payload.passport,
            classroom_id=payload.classroom_id,
        )

        return await self.repository.create(student)

    async def get_students(
        self,
        current_user,
        class_id: int | None = None,
    ):
        school_id = None

        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

        return await self.repository.get_all(
            school_id,
            class_id,
        )

    async def get_student(
        self,
        student_id: int,
        current_user,
    ):
        school_id = None

        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

        student = await self.repository.get_by_id(
            student_id,
            school_id,
        )

        if not student:
            raise HTTPException(
                status_code=404,
                detail="Student not found",
            )

        return student

    async def deactivate_student(
        self,
        student_id: int,
        current_user,
    ):
        school_id = None

        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

        student = await self.repository.get_by_id(
            student_id,
            school_id,
        )

        if not student:
            raise HTTPException(
                status_code=404,
                detail="Student not found",
            )

        student.is_active = False

        return await self.repository.update(student)

    async def activate_student(
        self,
        student_id: int,
        current_user,
    ):
        school_id = None

        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

        student = await self.repository.get_by_id(
            student_id,
            school_id,
        )

        if not student:
            raise HTTPException(
                status_code=404,
                detail="Student not found",
            )

        student.is_active = True

        return await self.repository.update(student)
