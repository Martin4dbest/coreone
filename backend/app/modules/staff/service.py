import io

import pandas as pd
from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.staff import Staff
from app.models.role import Role
from app.modules.staff.repository import StaffRepository
from app.modules.staff.schemas import (
    StaffCreateRequest,
    StaffUpdateRequest,
)
from app.modules.users.service import UserService


class StaffService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = StaffRepository(db)
        self.user_service = UserService(db)

    def _school_id(self, current_user):
        if current_user.role.name == "SUPER_ADMIN":
            return None

        return current_user.school_id

    async def create_staff(
        self,
        payload: StaffCreateRequest,
        current_user,
    ):
        if (
            current_user.role.name != "SUPER_ADMIN"
            and payload.school_id != current_user.school_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot create staff for another school",
            )

        existing_staff = await self.repository.get_by_employee_number(
            payload.employee_number,
            payload.school_id,
        )

        if existing_staff:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Employee number already exists",
            )

        result = await self.db.execute(
            select(Role).where(
                Role.name == "STAFF"
            )
        )

        staff_role = result.scalar_one_or_none()

        if not staff_role:
            raise HTTPException(
                status_code=500,
                detail="STAFF role not configured",
            )

        user = await self.user_service.create_internal_user(
            email=payload.email,
            password=payload.password,
            school_id=payload.school_id,
            role_id=staff_role.id,
        )

        staff = Staff(
            user_id=user.id,
            employee_number=payload.employee_number,
            first_name=payload.first_name,
            middle_name=payload.middle_name,
            last_name=payload.last_name,
            gender=payload.gender,
            date_of_birth=payload.date_of_birth,
            phone=payload.phone,
            address=payload.address,
            job_title=payload.job_title,
            department=payload.department,
            employment_type=payload.employment_type,
            date_employed=payload.date_employed,
            qualification=payload.qualification,
            emergency_contact_name=payload.emergency_contact_name,
            emergency_contact_relationship=payload.emergency_contact_relationship,
            emergency_contact_phone=payload.emergency_contact_phone,
            profile_photo=payload.profile_photo,
            notes=payload.notes,
        )

        return await self.repository.create(staff)

    async def import_staff(
        self,
        school_id: int,
        file: UploadFile,
        current_user,
    ):
        if (
            current_user.role.name != "SUPER_ADMIN"
            and current_user.school_id != school_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot import staff for another school",
            )

        filename = (file.filename or "").lower()

        if not filename.endswith((".csv", ".xlsx", ".xls")):
            raise HTTPException(
                status_code=400,
                detail="Only CSV/XLS/XLSX files are supported.",
            )

        try:
            content = await file.read()

            if filename.endswith(".csv"):
                df = pd.read_csv(io.BytesIO(content))
            else:
                df = pd.read_excel(io.BytesIO(content))

        except Exception:
            raise HTTPException(
                status_code=400,
                detail="Unable to read uploaded file.",
            )

        df.columns = [
            str(column).strip().lower()
            for column in df.columns
        ]

        required = [
            "employee_number",
            "first_name",
            "last_name",
            "email",
            "password",
        ]

        missing = [
            column
            for column in required
            if column not in df.columns
        ]

        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"Missing columns: {', '.join(missing)}",
            )

        if df.empty:
            raise HTTPException(
                status_code=400,
                detail="The uploaded file contains no staff records.",
            )

        if df["employee_number"].duplicated().any():
            raise HTTPException(
                status_code=400,
                detail="Duplicate employee numbers found in file.",
            )

        if df["email"].duplicated().any():
            raise HTTPException(
                status_code=400,
                detail="Duplicate email addresses found in file.",
            )

        created = []

        for index, row in df.iterrows():
            row_number = index + 2

            def value(column):
                if column not in df.columns:
                    return None

                item = row[column]

                if pd.isna(item):
                    return None

                text = str(item).strip()

                return text if text else None

            employee_number = value("employee_number")
            first_name = value("first_name")
            last_name = value("last_name")
            email = value("email")
            password = value("password")

            if not employee_number:
                raise HTTPException(
                    status_code=400,
                    detail=f"Row {row_number}: employee_number is required.",
                )

            if not first_name:
                raise HTTPException(
                    status_code=400,
                    detail=f"Row {row_number}: first_name is required.",
                )

            if not last_name:
                raise HTTPException(
                    status_code=400,
                    detail=f"Row {row_number}: last_name is required.",
                )

            if not email:
                raise HTTPException(
                    status_code=400,
                    detail=f"Row {row_number}: email is required.",
                )

            if not password:
                raise HTTPException(
                    status_code=400,
                    detail=f"Row {row_number}: password is required.",
                )

            existing_staff = await self.repository.get_by_employee_number(
                employee_number,
                school_id,
            )

            if existing_staff:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Row {row_number}: employee number "
                        f"'{employee_number}' already exists."
                    ),
                )

            existing_user = await self.user_service.repository.get_by_email(
                email
            )

            if existing_user:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Row {row_number}: email "
                        f"'{email}' already exists."
                    ),
                )

            date_of_birth = None
            if value("date_of_birth"):
                try:
                    date_of_birth = pd.to_datetime(
                        value("date_of_birth")
                    ).date()
                except Exception:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Row {row_number}: invalid date_of_birth.",
                    )

            date_employed = None
            if value("date_employed"):
                try:
                    date_employed = pd.to_datetime(
                        value("date_employed")
                    ).date()
                except Exception:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Row {row_number}: invalid date_employed.",
                    )

            payload = StaffCreateRequest(
                email=email,
                password=password,
                school_id=school_id,
                employee_number=employee_number,
                first_name=first_name,
                middle_name=value("middle_name"),
                last_name=last_name,
                gender=value("gender"),
                date_of_birth=date_of_birth,
                phone=value("phone"),
                address=value("address"),
                job_title=value("job_title"),
                department=value("department"),
                employment_type=value("employment_type"),
                date_employed=date_employed,
                qualification=value("qualification"),
                emergency_contact_name=value("emergency_contact_name"),
                emergency_contact_relationship=value(
                    "emergency_contact_relationship"
                ),
                emergency_contact_phone=value(
                    "emergency_contact_phone"
                ),
                profile_photo=value("profile_photo"),
                notes=value("notes"),
            )

            staff = await self.create_staff(
                payload,
                current_user,
            )

            created.append(staff)

        return created

    async def get_my_profile(
        self,
        current_user,
    ):
        if current_user.role.name != "STAFF":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Staff access required",
            )

        staff = await self.repository.get_by_user_id(
            current_user.id
        )

        if not staff:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Staff profile not found",
            )

        return staff

    async def get_staff(
        self,
        current_user,
        school_id: int | None = None,
    ):
        if current_user.role.name == "SUPER_ADMIN":
            if school_id is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="school_id is required when viewing staff for a school",
                )

            return await self.repository.get_all(school_id)

        if school_id is not None and school_id != current_user.school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot view staff for another school",
            )

        return await self.repository.get_all(
            current_user.school_id
        )

    async def get_staff_member(
        self,
        staff_id: int,
        current_user,
    ):
        staff = await self.repository.get_by_id(
            staff_id,
            self._school_id(current_user),
        )

        if not staff:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Staff not found",
            )

        return staff

    async def update_staff(
        self,
        staff_id: int,
        payload: StaffUpdateRequest,
        current_user,
    ):
        staff = await self.get_staff_member(
            staff_id,
            current_user,
        )

        if payload.employee_number is not None:
            existing = await self.repository.get_by_employee_number(
                payload.employee_number,
                staff.user.school_id,
            )

            if existing and existing.id != staff.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Employee number already exists",
                )

            staff.employee_number = payload.employee_number

        if payload.first_name is not None:
            staff.first_name = payload.first_name

        if payload.middle_name is not None:
            staff.middle_name = payload.middle_name

        if payload.last_name is not None:
            staff.last_name = payload.last_name

        if payload.gender is not None:
            staff.gender = payload.gender

        if payload.date_of_birth is not None:
            staff.date_of_birth = payload.date_of_birth

        if payload.phone is not None:
            staff.phone = payload.phone

        if payload.address is not None:
            staff.address = payload.address

        if payload.job_title is not None:
            staff.job_title = payload.job_title

        if payload.department is not None:
            staff.department = payload.department

        if payload.employment_type is not None:
            staff.employment_type = payload.employment_type

        if payload.date_employed is not None:
            staff.date_employed = payload.date_employed

        if payload.qualification is not None:
            staff.qualification = payload.qualification

        if payload.emergency_contact_name is not None:
            staff.emergency_contact_name = payload.emergency_contact_name

        if payload.emergency_contact_relationship is not None:
            staff.emergency_contact_relationship = payload.emergency_contact_relationship

        if payload.emergency_contact_phone is not None:
            staff.emergency_contact_phone = payload.emergency_contact_phone

        if payload.profile_photo is not None:
            staff.profile_photo = payload.profile_photo

        if payload.notes is not None:
            staff.notes = payload.notes

        if payload.email is not None:
            staff.user.email = str(payload.email)

        await self.db.commit()
        await self.db.refresh(staff)

        return staff

    async def delete_staff(
        self,
        staff_id: int,
        current_user,
    ):
        staff = await self.get_staff_member(
            staff_id,
            current_user,
        )

        user = staff.user

        await self.db.delete(staff)
        await self.db.flush()

        if user:
            await self.db.delete(user)

        await self.db.commit()


    async def set_staff_status(
        self,
        staff_id: int,
        is_active: bool,
        current_user,
    ):
        staff = await self.get_staff_member(
            staff_id,
            current_user,
        )

        staff.user.is_active = is_active

        await self.db.commit()
        await self.db.refresh(staff)

        return staff
