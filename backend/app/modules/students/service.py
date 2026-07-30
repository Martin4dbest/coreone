from pathlib import Path
import io
import os
import uuid

import pandas as pd

from fastapi import UploadFile, HTTPException

from sqlalchemy import select

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.classroom import Classroom
from app.models.role import Role
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.user import User

from app.modules.auth.security import hash_password

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
        tenant,
        current_user,
    ):
        self._ensure_teacher_cannot_manage_students(current_user)


        school_id = tenant.school_id

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
        tenant,
        current_user,
        class_id: int | None = None,
    ):
        school_id = None
        teacher_id = None

        role = current_user.role.name

        if role != "SUPER_ADMIN":
            school_id = tenant.school_id

        if role == "TEACHER":
            result = await self.db.execute(
                select(Teacher).where(
                    Teacher.user_id == current_user.id,
                )
            )

            teacher = result.scalar_one_or_none()

            if teacher is None:
                raise HTTPException(
                    status_code=404,
                    detail="Teacher profile not found.",
                )

            teacher_id = teacher.id


        return await self.repository.get_all(
            school_id=school_id,
            class_id=class_id,
            teacher_id=teacher_id,
        )

    async def _get_teacher_profile(self, current_user):
        if current_user.role.name != "TEACHER":
            return None

        result = await self.db.execute(
            select(Teacher).where(
                Teacher.user_id == current_user.id,
            )
        )

        teacher = result.scalar_one_or_none()

        if teacher is None:
            raise HTTPException(
                status_code=404,
                detail="Teacher profile not found.",
            )

        return teacher

    def _ensure_teacher_cannot_manage_students(self, current_user):
        if current_user.role.name == "TEACHER":
            raise HTTPException(
                status_code=403,
                detail="Teachers are not allowed to manage students.",
            )


    async def _get_teacher_id(
        self,
        current_user,
    ) -> int | None:
        teacher = await self._get_teacher_profile(current_user)

        if teacher is None:
            return None

        return teacher.id

    async def get_student(
        self,
        student_id: int,
        tenant,
        current_user,
    ):
        school_id = None
        teacher_id = None

        if current_user.role.name != "SUPER_ADMIN":
            school_id = tenant.school_id

        teacher_id = await self._get_teacher_id(
            current_user
        )

        student = await self.repository.get_by_id(
            student_id,
            school_id,
            teacher_id,
        )

        # secure fallback when frontend sends user_id instead of student.id
        if not student:
            result = await self.db.execute(
                select(Student).where(
                    Student.user_id == student_id,
                    Student.school_id == school_id,
                )
            )

            student = result.scalar_one_or_none()

        if not student:
            raise HTTPException(
                status_code=404,
                detail="Student not found.",
            )


        return student

    async def deactivate_student(
                self,
        student_id: int,
        current_user,
    ):
        self._ensure_teacher_cannot_manage_students(current_user)

        school_id = None

        if current_user.role.name != "SUPER_ADMIN":
            school_id = tenant.school_id

        student = await self.repository.get_by_id(
            student_id,
            school_id,
        )

        # fallback when frontend sends user_id instead of student.id
        if not student:
            result = await self.db.execute(
                select(Student).where(
                    Student.user_id == student_id,
                    Student.school_id == school_id,
                )
            )

            student = result.scalar_one_or_none()

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
        self._ensure_teacher_cannot_manage_students(current_user)

        school_id = None

        if current_user.role.name != "SUPER_ADMIN":
            school_id = tenant.school_id

        student = await self.repository.get_by_id(
            student_id,
            school_id,
        )

        # fallback when frontend sends user_id instead of student.id
        if not student:
            result = await self.db.execute(
                select(Student).where(
                    Student.user_id == student_id,
                    Student.school_id == school_id,
                )
            )

            student = result.scalar_one_or_none()

        if not student:
            raise HTTPException(
                status_code=404,
                detail="Student not found",
            )

        student.is_active = True

        return await self.repository.update(student)



    async def import_students(
                self,
        school_id: int,
        file: UploadFile,
        current_user,
    ):
        self._ensure_teacher_cannot_manage_students(current_user)

        """
        Bulk import students from CSV/XLS/XLSX.
        """

        if (
            current_user.role.name != "SUPER_ADMIN"
            and current_user.school_id != school_id
        ):
            raise HTTPException(
                status_code=403,
                detail="You cannot import students for another school.",
            )

        filename = (file.filename or "").lower()

        if not filename.endswith(
            (".csv", ".xlsx", ".xls")
        ):
            raise HTTPException(
                status_code=400,
                detail="Only CSV/XLS/XLSX files are supported.",
            )

        try:
            content = await file.read()

            if filename.endswith(".csv"):
                df = pd.read_csv(
                    io.BytesIO(content)
                )
            else:
                df = pd.read_excel(
                    io.BytesIO(content)
                )

        except Exception:
            raise HTTPException(
                status_code=400,
                detail="Unable to read uploaded file.",
            )

        df.columns = [
            str(c).strip().lower()
            for c in df.columns
        ]

        required = [
            "classroom_id",
            "admission_number",
            "first_name",
            "last_name",
            "gender",
            "date_of_birth",
            "email",
            "password",
        ]

        missing = [
            c
            for c in required
            if c not in df.columns
        ]

        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"Missing columns: {', '.join(missing)}",
            )

        if df["admission_number"].duplicated().any():
            raise HTTPException(
                status_code=400,
                detail="Duplicate admission numbers found in file.",
            )

        if df["email"].duplicated().any():
            raise HTTPException(
                status_code=400,
                detail="Duplicate email addresses found in file.",
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

        students = []

        async with self.db.begin_nested():

            for index, row in df.iterrows():

                classroom_value = str(
                    row["classroom_id"]
                ).strip()

                classroom = None

                if classroom_value.isdigit():
                    classroom = (
                        await self.db.execute(
                            select(Classroom).where(
                                Classroom.id == int(classroom_value),
                                Classroom.school_id == school_id,
                            )
                        )
                    ).scalar_one_or_none()

                else:
                    classroom = (
                        await self.db.execute(
                            select(Classroom).where(
                                Classroom.name == classroom_value,
                                Classroom.school_id == school_id,
                            )
                        )
                    ).scalar_one_or_none()

                if classroom is None:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Row {index + 2}: Invalid classroom.",
                    )

                admission_number = str(
                    row["admission_number"]
                ).strip()

                existing = (
                    await self.repository.get_by_admission_number(
                        admission_number,
                        school_id,
                    )
                )

                if existing:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Admission number '{admission_number}' already exists.",
                    )

                email = str(row["email"]).strip()

                existing_user = (
                    await self.user_service.repository.get_by_email(
                        email
                    )
                )

                if existing_user:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Email '{email}' already exists.",
                    )

                gender = str(
                    row["gender"]
                ).strip().upper()

                if gender not in (
                    "MALE",
                    "FEMALE",
                ):
                    raise HTTPException(
                        status_code=400,
                        detail=f"Row {index + 2}: Invalid gender.",
                    )

                try:
                    date_of_birth = pd.to_datetime(
                        row["date_of_birth"]
                    ).date()
                except Exception:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Row {index + 2}: Invalid date_of_birth.",
                    )

                user = User(
                    school_id=school_id,
                    role_id=student_role.id,
                    email=email,
                    hashed_password=hash_password(
                        str(row["password"])
                    ),
                    is_active=True,
                    is_verified=False,
                )

                self.db.add(user)

                await self.db.flush()

                student = Student(
                    user_id=user.id,
                    school_id=school_id,
                    classroom_id=classroom.id,
                    admission_number=admission_number,
                    first_name=str(
                        row["first_name"]
                    ).strip(),
                    last_name=str(
                        row["last_name"]
                    ).strip(),
                    middle_name=(
                        None
                        if "middle_name" not in df.columns
                        or pd.isna(
                            row.get("middle_name")
                        )
                        else str(
                            row["middle_name"]
                        ).strip()
                    ),
                    gender=gender,
                    date_of_birth=date_of_birth,
                    passport=None,
                    is_active=True,
                )

                self.db.add(student)

                students.append(student)

            await self.db.flush()

        await self.db.commit()

        for student in students:
            await self.db.refresh(student)

        return students


    async def upload_passport(
        self,
        student_id: int,
        tenant,
        file: UploadFile,
        current_user,
    ):
        self._ensure_teacher_cannot_manage_students(current_user)

        school_id = None

        if current_user.role.name != "SUPER_ADMIN":
            school_id = tenant.school_id

        student = await self.repository.get_by_id(
            student_id,
            school_id,
        )

        # fallback when frontend sends user_id instead of student.id
        if not student:
            result = await self.db.execute(
                select(Student).where(
                    Student.user_id == student_id,
                    Student.school_id == school_id,
                )
            )

            student = result.scalar_one_or_none()

        if not student:
            raise HTTPException(
                status_code=404,
                detail="Student not found",
            )

        folder = str(
            Path(__file__).resolve().parents[3]
            / "uploads"
            / "students"
            / str(student.school_id)
        )
        os.makedirs(folder, exist_ok=True)

        ext = os.path.splitext(file.filename)[1]

        filename = f"{uuid.uuid4().hex}{ext}"

        path = os.path.join(folder, filename)

        with open(path, "wb") as f:
            f.write(await file.read())

        relative_path = os.path.relpath(
            path,
            "uploads",
        ).replace("\\", "/")

        student.passport = "/uploads/" + relative_path

        return await self.repository.update(student)


    async def delete_student(
        self,
        student_id: int,
        tenant,
        current_user,
    ):
        self._ensure_teacher_cannot_manage_students(current_user)

        student = await self.repository.get_by_id(
            student_id,
            tenant.school_id,
        )

        if not student:
            raise HTTPException(
                status_code=404,
                detail="Student not found",
            )

        if hasattr(student, "user") and student.user:
            await self.db.delete(student.user)

        await self.db.delete(student)
        await self.db.commit()

