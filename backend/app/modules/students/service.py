from fastapi import HTTPException

from sqlalchemy.ext.asyncio import AsyncSession

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
    ):
        existing = await self.repository.get_by_admission_number(
            payload.admission_number
        )

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Admission number already exists",
            )

        user = await self.user_service.create_internal_user(
            email=payload.email,
            password=payload.password,
            school_id=payload.school_id,
            role_id=payload.role_id,
        )

        student = Student(
            user_id=user.id,
            admission_number=payload.admission_number,
            first_name=payload.first_name,
            last_name=payload.last_name,
            middle_name=payload.middle_name,
            gender=payload.gender,
            date_of_birth=payload.date_of_birth,
            passport=payload.passport,
        )

        return await self.repository.create(student)

    async def get_students(self):
        return await self.repository.get_all()

    async def get_student(
        self,
        student_id: int,
    ):
        student = await self.repository.get_by_id(student_id)

        if not student:
            raise HTTPException(
                status_code=404,
                detail="Student not found",
            )

        return student
