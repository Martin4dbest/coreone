from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.classroom import Classroom
from app.models.student import Student
from app.models.user import User
from app.models.school_branding import SchoolBranding
from app.modules.results.service import ResultService


class MobileStudentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_dashboard(
        self,
        current_user: User,
    ):
        student_result = await self.db.execute(
            select(Student)
            .options(
                selectinload(Student.classroom).selectinload(Classroom.level),
                selectinload(Student.school),
            )
            .where(Student.user_id == current_user.id)
        )

        student = student_result.scalar_one_or_none()

        if not student:
            return {
                "message": "Student profile not found"
            }

        branding_result = await self.db.execute(
            select(SchoolBranding).where(
                SchoolBranding.school_id == student.school_id
            )
        )

        branding = branding_result.scalar_one_or_none()

        school_name = (
            student.school.name
            if student.school
            else None
        )

        classroom_name = (
            student.classroom.name
            if student.classroom
            else None
        )

        level_name = (
            student.classroom.level.name
            if student.classroom
            and student.classroom.level
            else None
        )

        return {
            "tenant": {
                "id": student.school.id if student.school else None,
                "name": school_name,
                "school_code": (
                    student.school.school_code
                    if student.school
                    else None
                ),
                "logo": (
                    branding.logo_url
                    if branding
                    else None
                ),
                "app_icon": (
                    branding.app_icon_url
                    if branding
                    else None
                ),
                "primary_color": (
                    branding.primary_color
                    if branding
                    else None
                ),
                "secondary_color": (
                    branding.secondary_color
                    if branding
                    else None
                ),
                "accent_color": (
                    getattr(
                        branding,
                        "accent_color",
                        None,
                    )
                    if branding
                    else None
                ),
            },

            "student": {
                "id": str(student.id),
                "first_name": student.first_name,
                "last_name": student.last_name,
                "middle_name": student.middle_name,
                "school_name": school_name,
                "class_level": level_name,
                "classroom": classroom_name,
                "department": (
                    student.department.name
                    if hasattr(student, "department")
                    and student.department
                    else None
                ),
                "admission_number": student.admission_number,
                "email": current_user.email,
                "profile_image": student.passport,
            },

            "overview": {
                "attendance_percentage": 0,
                "latest_grade": None,
                "pending_assignments_count": 0,
                "cbt_average_score": 0,
            },

            "features": [
                {
                    "title": "Attendance",
                    "icon": "calendar",
                },
                {
                    "title": "Results",
                    "icon": "award",
                },
                {
                    "title": "Assignments",
                    "icon": "book-open",
                },
                {
                    "title": "CBT",
                    "icon": "monitor",
                },
                {
                    "title": "E-Books",
                    "icon": "library",
                },
                {
                    "title": "Learning Videos",
                    "icon": "youtube",
                },
                {
                    "title": "Internal Browser",
                    "icon": "globe",
                },
            ],
        }

    async def get_results(
        self,
        current_user: User,
    ):
        student_result = await self.db.execute(
            select(Student).where(
                Student.user_id == current_user.id
            )
        )

        student = student_result.scalar_one_or_none()

        if not student:
            return {
                "message": "Student profile not found"
            }

        return await ResultService(self.db).get_student_report(
            student.id,
            current_user,
        )

    async def get_results_pdf(
        self,
        current_user: User,
    ):
        student_result = await self.db.execute(
            select(Student).where(
                Student.user_id == current_user.id
            )
        )

        student = student_result.scalar_one_or_none()

        if not student:
            return None

        return await ResultService(self.db).generate_student_report_pdf(
            student.id,
            current_user,
        )

