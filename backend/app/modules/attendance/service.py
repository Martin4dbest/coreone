from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.attendance import Attendance
from app.models.classroom import Classroom
from app.models.student import Student
from app.models.teacher_subject import TeacherSubject
from app.modules.attendance.repository import AttendanceRepository
from app.modules.attendance.schemas import (
    AttendanceCreateRequest,
    AttendanceUpdateRequest,
)
from app.core.teacher_access import check_teacher_class_access


class AttendanceService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = AttendanceRepository(db)

    async def _resolve_school_id(
        self,
        current_user,
        tenant,
    ) -> int:

        role = current_user.role.name

        if role == "SUPER_ADMIN":
            if tenant.school_id is not None:
                return tenant.school_id

            if current_user.school_id is not None:
                return current_user.school_id

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A school must be selected.",
            )

        if tenant.school_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="School could not be resolved.",
            )

        if current_user.school_id != tenant.school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot access attendance for another school.",
            )

        return tenant.school_id

    async def _check_class_access(
        self,
        current_user,
        classroom_id: int,
        school_id: int,
    ):

        classroom = await self.db.execute(
            select(Classroom).where(
                Classroom.id == classroom_id,
                Classroom.school_id == school_id,
            )
        )

        classroom = classroom.scalar_one_or_none()

        if not classroom:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class not found in this school.",
            )

        if current_user.role.name == "TEACHER":
            await check_teacher_class_access(
                self.db,
                current_user,
                classroom_id,
            )

        elif current_user.role.name not in {
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        }:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not permitted to manage attendance.",
            )

        return classroom

    async def get_accessible_classes(
        self,
        current_user,
        tenant,
    ):
        school_id = await self._resolve_school_id(
            current_user,
            tenant,
        )

        role = current_user.role.name

        # SUPER ADMIN and SCHOOL ADMIN can manage
        # every active class in the selected school.
        if role in {"SUPER_ADMIN", "SCHOOL_ADMIN"}:
            result = await self.db.execute(
                select(Classroom)
                .where(
                    Classroom.school_id == school_id,
                    Classroom.is_active == True,
                )
                .order_by(Classroom.name.asc())
            )

            return result.scalars().all()

        # TEACHER can only manage classes where:
        # 1. They are the class teacher, OR
        # 2. They have an active subject assignment.
        if role == "TEACHER":
            teacher_id = current_user.teacher.id if current_user.teacher else None

            if teacher_id is None:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User is not linked to a teacher profile.",
                )

            result = await self.db.execute(
                select(Classroom)
                .outerjoin(
                    TeacherSubject,
                    TeacherSubject.classroom_id == Classroom.id,
                )
                .where(
                    Classroom.school_id == school_id,
                    Classroom.is_active == True,
                    (
                        (Classroom.class_teacher_id == teacher_id)
                        |
                        (
                            (TeacherSubject.teacher_id == teacher_id)
                            &
                            (TeacherSubject.is_active == True)
                        )
                    ),
                )
                .distinct()
                .order_by(Classroom.name.asc())
            )

            return result.scalars().all()

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not permitted to manage attendance.",
        )

    async def create_attendance(
        self,
        payload: AttendanceCreateRequest,
        current_user,
        tenant,
    ):

        school_id = await self._resolve_school_id(
            current_user,
            tenant,
        )

        if payload.school_id != school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Attendance school does not match the active school.",
            )

        await self._check_class_access(
            current_user,
            payload.classroom_id,
            school_id,
        )

        student_result = await self.db.execute(
            select(Student).where(
                Student.id == payload.student_id,
                Student.school_id == school_id,
            )
        )

        student = student_result.scalar_one_or_none()

        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found in this school.",
            )

        if student.classroom_id != payload.classroom_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student does not belong to the selected class.",
            )

        existing = await self.repository.get_student_attendance_by_date(
            payload.student_id,
            payload.attendance_date,
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Attendance already recorded for this student on this date.",
            )

        allowed_statuses = {
            "present",
            "absent",
            "late",
            "excused",
        }

        attendance_status = payload.status.lower().strip()

        if attendance_status not in allowed_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status must be present, absent, late, or excused.",
            )

        attendance = Attendance(
            school_id=school_id,
            student_id=payload.student_id,
            classroom_id=payload.classroom_id,
            attendance_date=payload.attendance_date,
            status=attendance_status,
            remarks=payload.remarks,
        )

        return await self.repository.create(attendance)

    async def update_attendance(
        self,
        attendance_id: int,
        payload: AttendanceUpdateRequest,
        current_user,
        tenant,
    ):
        school_id = await self._resolve_school_id(
            current_user,
            tenant,
        )

        attendance = await self.repository.get_by_id(
            attendance_id,
            school_id,
        )

        if not attendance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attendance record not found.",
            )

        await self._check_class_access(
            current_user,
            attendance.classroom_id,
            school_id,
        )

        allowed_statuses = {
            "present",
            "absent",
            "late",
            "excused",
        }

        attendance_status = payload.status.lower().strip()

        if attendance_status not in allowed_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status must be present, absent, late, or excused.",
            )

        attendance.status = attendance_status

        if payload.remarks is not None:
            attendance.remarks = payload.remarks

        await self.db.commit()
        await self.db.refresh(attendance)

        return attendance

    async def get_attendance(
        self,
        current_user,
        tenant,
        classroom_id: int | None = None,
        attendance_date: date | None = None,
    ):

        school_id = await self._resolve_school_id(
            current_user,
            tenant,
        )

        if classroom_id is not None:
            await self._check_class_access(
                current_user,
                classroom_id,
                school_id,
            )

        records = await self.repository.get_all(
            school_id=school_id,
            classroom_id=classroom_id,
            attendance_date=attendance_date,
        )

        if current_user.role.name == "TEACHER":
            filtered = []

            for record in records:
                try:
                    await check_teacher_class_access(
                        self.db,
                        current_user,
                        record.classroom_id,
                    )
                    filtered.append(record)
                except HTTPException:
                    continue

            return filtered

        return records

    async def get_attendance_by_id(
        self,
        attendance_id: int,
        current_user,
        tenant,
    ):

        school_id = await self._resolve_school_id(
            current_user,
            tenant,
        )

        attendance = await self.repository.get_by_id(
            attendance_id,
            school_id,
        )

        if not attendance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attendance record not found.",
            )

        await self._check_class_access(
            current_user,
            attendance.classroom_id,
            school_id,
        )

        return attendance

    async def get_student_attendance(
        self,
        current_user,
    ):

        if current_user.role.name != "STUDENT":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only students can access their attendance.",
            )

        result = await self.db.execute(
            select(Student).where(
                Student.user_id == current_user.id
            )
        )

        student = result.scalar_one_or_none()

        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student profile not found.",
            )

        records = await self.repository.get_student_records(
            student.id,
            student.school_id,
        )

        total = len(records)

        present_count = sum(
            1
            for record in records
            if record.status in {"present", "late"}
        )

        percentage = (
            round((present_count / total) * 100, 2)
            if total
            else 0
        )

        return {
            "student_id": student.id,
            "attendance_percentage": percentage,
            "total_days": total,
            "present_days": present_count,
            "absent_days": sum(
                1
                for record in records
                if record.status == "absent"
            ),
            "late_days": sum(
                1
                for record in records
                if record.status == "late"
            ),
            "excused_days": sum(
                1
                for record in records
                if record.status == "excused"
            ),
            "records": records,
        }
