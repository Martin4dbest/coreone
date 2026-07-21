from io import BytesIO
import os

from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.student import Student
from app.models.subject import Subject
from app.models.classroom import Classroom
from app.models.term import Term
from app.models.academic_session import AcademicSession
from app.models.result import Result
from app.models.grading_system import GradingSystem
from app.models.school import School
from app.models.school_branding import SchoolBranding
from app.models.attendance import Attendance

from app.modules.results.repository import ResultRepository
from app.modules.results.schemas import (
    ResultCreateRequest,
    ResultUpdateRequest,
    BulkResultEntryRequest,
)


class ResultService:

    def __init__(self, db: AsyncSession):
        self.repository = ResultRepository(db)
        self.db = db

    async def get_grade_for_score(
        self,
        school_id: int,
        score: float,
    ):
        result = await self.db.execute(
            select(GradingSystem).where(
                GradingSystem.school_id == school_id,
                GradingSystem.minimum_score <= score,
                GradingSystem.maximum_score >= score,
            )
        )
        return result.scalar_one_or_none()

    async def get_teacher_results(self, current_user):
        return await self.repository.get_teacher_results(current_user.id)

    async def create_result(
        self,
        payload: ResultCreateRequest,
        current_user,
    ):
        if (
            current_user.role.name != "SUPER_ADMIN"
            and payload.school_id != current_user.school_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized school access",
            )

        total = payload.ca_score + payload.exam_score

        grading = await self.get_grade_for_score(
            payload.school_id,
            total,
        )

        result = Result(
            school_id=payload.school_id,
            student_id=payload.student_id,
            class_id=payload.class_id,
            subject_id=payload.subject_id,
            term_id=payload.term_id,
            academic_session_id=payload.academic_session_id,
            ca_score=payload.ca_score,
            exam_score=payload.exam_score,
            total_score=total,
            grade=grading.grade if grading else None,
            remark=grading.remark if grading else None,
            teacher_comment=payload.teacher_comment,
            principal_comment=payload.principal_comment,
            is_active=True,
        )

        return await self.repository.create(result)

    async def update_result(
        self,
        result_id: int,
        payload: ResultUpdateRequest,
        current_user,
    ):
        result = await self.repository.get_by_id(result_id)

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Result not found",
            )

        total = payload.ca_score + payload.exam_score
        grading = await self.get_grade_for_score(
            result.school_id,
            total,
        )

        result.student_id = payload.student_id
        result.class_id = payload.class_id
        result.subject_id = payload.subject_id
        result.term_id = payload.term_id
        result.academic_session_id = payload.academic_session_id
        result.ca_score = payload.ca_score
        result.exam_score = payload.exam_score
        result.total_score = total
        result.grade = grading.grade if grading else None
        result.remark = grading.remark if grading else None

        if payload.teacher_comment is not None:
            result.teacher_comment = payload.teacher_comment
        if payload.principal_comment is not None:
            result.principal_comment = payload.principal_comment

        return await self.repository.update(result)

    async def get_results(
        self,
        current_user,
        school_id: int | None = None,
    ):
        role = current_user.role.name

        if role == "TEACHER":
            return await self.repository.get_teacher_results(current_user.id)

        if role != "SUPER_ADMIN":
            school_id = current_user.school_id

        return await self.repository.get_all(school_id)

    async def get_result(self, result_id: int):
        result = await self.repository.get_by_id(result_id)

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Result not found",
            )

        return result

    async def delete_result(
        self,
        result_id: int,
        current_user,
    ):
        result = await self.repository.get_by_id(result_id)

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Result not found",
            )

        await self.repository.delete(result)

        return {"message": "Result deleted successfully"}

    async def delete_all_results(
        self,
        current_user,
    ):
        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Specify school deletion through admin tools",
            )

        await self.repository.delete_all(school_id)

        return {"message": "All results deleted"}

    async def get_student_report(
        self,
        student_id: int,
        current_user,
    ):
        student_query = await self.db.execute(
            select(
                Student,
                School.name.label("school_name"),
                School.logo.label("school_logo"),
                Classroom.name.label("class_name"),
                SchoolBranding.motto,
                SchoolBranding.logo_url,
                SchoolBranding.primary_color,
                SchoolBranding.secondary_color,
                SchoolBranding.accent_color,
            )
            .join(School, School.id == Student.school_id)
            .outerjoin(Classroom, Classroom.id == Student.classroom_id)
            .outerjoin(
                SchoolBranding,
                SchoolBranding.school_id == Student.school_id,
            )
            .where(Student.id == student_id)
        )

        student_row = student_query.first()

        if not student_row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found",
            )

        student = student_row[0]

        result_query = await self.db.execute(
            select(Result, Subject.name.label("subject_name"))
            .outerjoin(Subject, Subject.id == Result.subject_id)
            .where(
                Result.student_id == student_id,
                Result.is_active == True,
            )
        )

        results_rows = result_query.all()

        if not results_rows:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No results found",
            )

        subjects = []
        total_score = 0

        for item, subject_name in results_rows:
            grading = await self.get_grade_for_score(
                item.school_id,
                item.total_score,
            )

            subjects.append(
                {
                    "name": subject_name or "Unknown",
                    "ca": item.ca_score,
                    "exam": item.exam_score,
                    "total": item.total_score,
                    "grade": grading.grade if grading else item.grade,
                    "remark": grading.remark if grading else item.remark,
                }
            )
            total_score += item.total_score

        first_result = results_rows[0][0]
        average = (
            total_score / len(subjects)
            if subjects
            else 0
        )

        # Position calculation
        position_query = await self.db.execute(
            select(
                Result.student_id,
                func.avg(Result.total_score).label("average"),
            )
            .where(
                Result.class_id == first_result.class_id,
                Result.term_id == first_result.term_id,
                Result.academic_session_id == first_result.academic_session_id,
            )
            .group_by(Result.student_id)
            .order_by(func.avg(Result.total_score).desc())
        )

        ranking = position_query.all()
        position = None

        for index, row in enumerate(ranking, start=1):
            if row.student_id == student_id:
                position = index
                break

        present_query = await self.db.execute(
            select(func.count(Attendance.id)).where(
                Attendance.student_id == student_id,
                Attendance.status == "present",
            )
        )
        present_days = present_query.scalar() or 0

        total_attendance_query = await self.db.execute(
            select(func.count(Attendance.id)).where(
                Attendance.student_id == student_id
            )
        )
        total_days = total_attendance_query.scalar() or 0

        attendance_percentage = (
            round((present_days / total_days) * 100, 2)
            if total_days > 0
            else 0
        )

        session_query = await self.db.execute(
            select(AcademicSession.name).where(
                AcademicSession.id == first_result.academic_session_id
            )
        )
        session_name = session_query.scalar_one_or_none()

        term_query = await self.db.execute(
            select(Term.name).where(
                Term.id == first_result.term_id
            )
        )
        term_name = term_query.scalar_one_or_none()

        middle_name_str = (
            f"{student.middle_name} " if student.middle_name else ""
        )

        return {
            "session": session_name,
            "term": term_name,
            "student": {
                "name": f"{student.first_name} {middle_name_str}{student.last_name}",
                "admission_number": student.admission_number,
                "passport": getattr(student, "passport", None),
                "class": student_row.class_name,
            },
            "school": {
                "id": student.school_id,
                "name": student_row.school_name,
                "logo": (
                    student_row.logo_url or student_row.school_logo
                ),
                "motto": student_row.motto,
                "primary_color": student_row.primary_color,
                "secondary_color": student_row.secondary_color,
                "accent_color": student_row.accent_color,
            },
            "subjects": subjects,
            "total": total_score,
            "average": round(average, 2),
            "position": position,
            "attendance": attendance_percentage,
            "remark": (
                "Excellent Performance"
                if average >= 80
                else "Good Performance"
                if average >= 60
                else "Needs Improvement"
            ),
            "comments": {
                "teacher": first_result.teacher_comment,
                "principal": first_result.principal_comment,
            },
        }

    async def add_comment(
        self,
        result_id: int,
        payload,
        current_user,
    ):
        result = await self.repository.get_by_id(result_id)

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Result not found",
            )

        role = current_user.role.name

        if role == "TEACHER":
            result.teacher_comment = payload.comment
            if hasattr(result, "teacher_comment_by"):
                result.teacher_comment_by = current_user.id
        elif role == "PRINCIPAL":
            result.principal_comment = payload.comment
            if hasattr(result, "principal_comment_by"):
                result.principal_comment_by = current_user.id
        elif role == "SCHOOL_ADMIN":
            if hasattr(result, "admin_comment"):
                result.admin_comment = payload.comment
            if hasattr(result, "admin_comment_by"):
                result.admin_comment_by = current_user.id
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot add result comments",
            )

        return await self.repository.update(result)

    async def generate_student_report_pdf(
        self,
        student_id: int,
        current_user,
    ):
        from reportlab.platypus import (
            SimpleDocTemplate,
            Paragraph,
            Spacer,
            Table,
            TableStyle,
            Image as RLImage,
        )
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import inch
        from reportlab.lib.colors import HexColor
        from reportlab.lib import colors

        report = await self.get_student_report(
            student_id,
            current_user,
        )

        branding_result = await self.db.execute(
            select(SchoolBranding).where(
                SchoolBranding.school_id == report["school"]["id"]
            )
        )
        branding = branding_result.scalar_one_or_none()

        primary_color = (
            branding.primary_color
            if branding and branding.primary_color
            else "#2563EB"
        )

        buffer = BytesIO()
        pdf = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            title="Student Report Card",
        )

        styles = getSampleStyleSheet()
        brand_color = HexColor(primary_color)
        styles["Title"].textColor = brand_color
        styles["Heading2"].textColor = brand_color
        elements = []

        # SCHOOL LOGO
        logo = report["school"]["logo"]
        if logo:
            logo_path = logo.replace("/uploads/", "uploads/").lstrip("/")
            if os.path.exists(logo_path):
                elements.append(
                    RLImage(
                        logo_path,
                        width=1 * inch,
                        height=1 * inch,
                    )
                )

        elements.append(
            Paragraph(
                report["school"]["name"] or "School Name",
                styles["Title"],
            )
        )

        if report["school"]["motto"]:
            elements.append(
                Paragraph(
                    report["school"]["motto"],
                    styles["Italic"],
                )
            )

        elements.append(Spacer(1, 20))
        elements.append(
            Paragraph(
                "STUDENT REPORT CARD",
                styles["Heading2"],
            )
        )

        student_table = Table(
            [
                ["Student", report["student"]["name"]],
                ["Admission No", report["student"]["admission_number"]],
                ["Class", str(report["student"]["class"] or "N/A")],
                ["Attendance", f"{report['attendance']}%"],
            ]
        )

        student_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (0, -1), brand_color),
                    ("TEXTCOLOR", (0, 0), (0, -1), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.5, brand_color),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        elements.append(student_table)
        elements.append(Spacer(1, 20))

        results_data = [
            ["Subject", "CA", "Exam", "Total", "Grade"]
        ]

        for item in report["subjects"]:
            results_data.append(
                [
                    item["name"],
                    item["ca"],
                    item["exam"],
                    item["total"],
                    item["grade"] or "",
                ]
            )

        table = Table(results_data)
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), brand_color),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.5, brand_color),
                ]
            )
        )
        elements.append(table)
        elements.append(Spacer(1, 20))

        summary = Table(
            [
                ["Total", "Average", "Position"],
                [report["total"], report["average"], report["position"] or "N/A"],
            ]
        )

        summary.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), brand_color),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.5, brand_color),
                ]
            )
        )
        elements.append(summary)
        elements.append(Spacer(1, 30))

        elements.append(
            Paragraph(
                f"Teacher Comment: {report['comments']['teacher'] or ''}",
                styles["Normal"],
            )
        )
        elements.append(Spacer(1, 15))

        elements.append(
            Paragraph(
                f"Principal Comment: {report['comments']['principal'] or ''}",
                styles["Normal"],
            )
        )
        elements.append(Spacer(1, 50))

        signature = Table(
            [
                ["________________", "________________"],
                ["Class Teacher", "Principal"],
            ]
        )
        elements.append(signature)

        pdf.build(elements)
        buffer.seek(0)
        return buffer

    async def create_bulk_results(
        self,
        payload: BulkResultEntryRequest,
        current_user,
    ):
        created = []

        for item in payload.results:
            total = item.ca_score + item.exam_score

            grading = await self.get_grade_for_score(
                payload.school_id,
                total,
            )

            existing = await self.repository.get_existing_result(
                payload.school_id,
                item.student_id,
                payload.class_id,
                payload.subject_id,
                payload.term_id,
                payload.academic_session_id,
            )

            if existing:
                existing.ca_score = item.ca_score
                existing.exam_score = item.exam_score
                existing.total_score = total
                existing.grade = grading.grade if grading else None
                existing.remark = grading.remark if grading else None

                created.append(await self.repository.update(existing))
            else:
                result = Result(
                    school_id=payload.school_id,
                    student_id=item.student_id,
                    class_id=payload.class_id,
                    subject_id=payload.subject_id,
                    term_id=payload.term_id,
                    academic_session_id=payload.academic_session_id,
                    ca_score=item.ca_score,
                    exam_score=item.exam_score,
                    total_score=total,
                    grade=grading.grade if grading else None,
                    remark=grading.remark if grading else None,
                    is_active=True,
                )

                created.append(await self.repository.create(result))

        return created