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
from app.models.teacher import Teacher
from app.models.teacher_subject import TeacherSubject
from app.models.grading_system import GradingSystem
from app.models.school import School
from app.models.school_branding import SchoolBranding
from app.models.attendance import Attendance

from app.core.school_access import check_school_access

from app.modules.results.repository import ResultRepository
from app.modules.results.schemas import (
    ResultCreateRequest,
    ResultUpdateRequest,
    BulkResultEntryRequest,
)



# ============================================================
# COREONE RESULT PUBLISHING WORKFLOW
# ============================================================
# Publishing rule:
#
#   Teacher enters teacher comment
#              ↓
#   Principal/School Admin enters principal comment
#              ↓
#   Result can be published
#
# A result MUST NOT become visible to students/parents while
# either required comment is missing.
# ============================================================

async def _validate_result_comments_before_publish(
    db,
    *,
    school_id=None,
    student_id=None,
    academic_session_id=None,
    term_id=None,
):
    """
    Validate that every result in the publishing scope has both
    teacher and principal comments.

    This intentionally validates the complete result set rather
    than checking only one subject/result row.
    """

    from sqlalchemy import select

    query = select(Result)

    if school_id is not None:
        query = query.where(Result.school_id == school_id)

    if student_id is not None:
        query = query.where(Result.student_id == student_id)

    if academic_session_id is not None:
        query = query.where(
            Result.academic_session_id == academic_session_id
        )

    if term_id is not None:
        query = query.where(Result.term_id == term_id)

    rows = (
        await db.execute(query)
    ).scalars().all()

    if not rows:
        raise ValueError("No results found to publish.")

    missing_teacher = []
    missing_principal = []

    for row in rows:
        teacher_comment = (
            getattr(row, "teacher_comment", None) or ""
        ).strip()

        principal_comment = (
            getattr(row, "principal_comment", None) or ""
        ).strip()

        if not teacher_comment:
            missing_teacher.append(row)

        if not principal_comment:
            missing_principal.append(row)

    if missing_teacher or missing_principal:
        messages = []

        if missing_teacher:
            messages.append(
                f"{len(missing_teacher)} result(s) are missing "
                "the teacher comment."
            )

        if missing_principal:
            messages.append(
                f"{len(missing_principal)} result(s) are missing "
                "the principal comment."
            )

        raise ValueError(
            "Cannot publish report card. "
            + " ".join(messages)
        )

    return rows


async def _save_result_comment(
    db,
    *,
    result,
    comment,
    comment_type,
    user_id=None,
):
    """
    Save one of the two report-card comments.

    comment_type:
      teacher
      principal
    """

    value = (comment or "").strip()

    if not value:
        raise ValueError(
            f"{comment_type.capitalize()} comment cannot be empty."
        )

    if comment_type == "teacher":
        result.teacher_comment = value

        if hasattr(result, "teacher_comment_by"):
            result.teacher_comment_by = user_id

    elif comment_type == "principal":
        result.principal_comment = value

        if hasattr(result, "principal_comment_by"):
            result.principal_comment_by = user_id

    else:
        raise ValueError("Invalid comment type.")

    # Any edit to comments means the result must be reviewed again.
    # A previously published result must not silently remain published
    # after its official comments are changed.
    if hasattr(result, "is_published"):
        result.is_published = False

    if hasattr(result, "published_at"):
        result.published_at = None

    await db.commit()
    await db.refresh(result)

    return result

class ResultService:

    async def _check_teacher_result_access(
        self,
        current_user,
        school_id: int,
        class_id: int,
        subject_id: int,
        academic_session_id: int,
    ):
        """
        Teachers may only create/update results for an active
        TeacherSubject allocation matching:

        - teacher
        - school
        - classroom
        - subject
        - academic session

        SUPER_ADMIN and SCHOOL_ADMIN are not restricted by
        teacher allocation rules.
        """

        role = getattr(
            getattr(current_user, "role", None),
            "name",
            "",
        )

        if role != "TEACHER":
            return

        teacher = await self.db.get(
            Teacher,
            getattr(current_user, "teacher_id", None),
        )

        # Some User models do not expose teacher_id directly.
        # Fall back to the Teacher.user_id relationship.
        if teacher is None:
            teacher_result = await self.db.execute(
                select(Teacher).where(
                    Teacher.user_id == current_user.id,
                    Teacher.school_id == school_id,
                )
            )
            teacher = teacher_result.scalar_one_or_none()

        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Teacher profile not found for the active school.",
            )

        if teacher.school_id != school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Teacher does not belong to the active school.",
            )

        allocation_result = await self.db.execute(
            select(TeacherSubject).where(
                TeacherSubject.teacher_id == teacher.id,
                TeacherSubject.school_id == school_id,
                TeacherSubject.classroom_id == class_id,
                TeacherSubject.subject_id == subject_id,
                TeacherSubject.academic_session_id == academic_session_id,
                TeacherSubject.is_active == True,
            )
        )

        allocation = allocation_result.scalar_one_or_none()

        if not allocation:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You are not assigned to this class, subject, "
                    "and academic session."
                ),
            )



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

    async def get_teacher_results(
        self,
        current_user,
        tenant,
    ):
        school_id = tenant.school_id

        if not school_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active school tenant.",
            )

        check_school_access(
            current_user,
            school_id,
        )

        return await self.repository.get_teacher_results(
            current_user.id,
            school_id,
        )

    async def create_result(
        self,
        payload: ResultCreateRequest,
        current_user,
        tenant,
    ):
        school_id = tenant.school_id

        if not school_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active school tenant.",
            )

        if payload.school_id != school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Result school does not match the active tenant.",
            )

        check_school_access(
            current_user,
            school_id,
        )

        await self._check_teacher_result_access(
            current_user=current_user,
            school_id=school_id,
            class_id=payload.class_id,
            subject_id=payload.subject_id,
            academic_session_id=payload.academic_session_id,
        )

        total = payload.ca_score + payload.exam_score

        grading = await self.get_grade_for_score(
            school_id,
            total,
        )

        result = Result(
            school_id=school_id,
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
        tenant,
    ):
        school_id = tenant.school_id

        if not school_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active school tenant.",
            )

        result = await self.repository.get_by_id(
            result_id,
            school_id,
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Result not found",
            )

        check_school_access(
            current_user,
            result.school_id,
        )

        if payload.school_id != school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Result school does not match the active tenant.",
            )

        await self._check_teacher_result_access(
            current_user=current_user,
            school_id=school_id,
            class_id=payload.class_id,
            subject_id=payload.subject_id,
            academic_session_id=payload.academic_session_id,
        )

        total = payload.ca_score + payload.exam_score

        grading = await self.get_grade_for_score(
            school_id,
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
        tenant,
    ):
        school_id = tenant.school_id

        if not school_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active school tenant.",
            )

        check_school_access(
            current_user,
            school_id,
        )

        role = current_user.role.name

        if role == "TEACHER":
            return await self.repository.get_teacher_results(
                current_user.id,
                school_id,
            )

        return await self.repository.get_all(
            school_id
        )

    async def get_result(
        self,
        result_id: int,
        current_user,
        tenant,
    ):
        school_id = tenant.school_id

        if not school_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active school tenant.",
            )

        result = await self.repository.get_by_id(
            result_id,
            school_id,
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Result not found",
            )

        check_school_access(
            current_user,
            result.school_id,
        )

        return result

    async def delete_result(
        self,
        result_id: int,
        current_user,
        tenant,
    ):
        school_id = tenant.school_id

        if not school_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active school tenant.",
            )

        result = await self.repository.get_by_id(
            result_id,
            school_id,
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Result not found",
            )

        check_school_access(
            current_user,
            result.school_id,
        )

        await self.repository.delete(result)

        return {
            "message": "Result deleted successfully"
        }

    async def delete_all_results(
        self,
        current_user,
        tenant,
    ):
        school_id = tenant.school_id

        if not school_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active school tenant.",
            )

        # SUPER_ADMIN is intentionally blocked from this
        # tenant endpoint. Tenant-wide destructive actions
        # must go through explicit admin tooling.
        if current_user.role.name == "SUPER_ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Use the Super Admin tools to delete school results.",
            )

        check_school_access(
            current_user,
            school_id,
        )

        await self.repository.delete_all(
            school_id
        )

        return {
            "message": "All results deleted"
        }

    async def get_student_report(
        self,
        student_id: int,
        current_user,
        tenant,
        report_class_id: int | None = None,
        report_term_id: int | None = None,
        report_session_id: int | None = None,
    ):
        school_id = tenant.school_id

        if not school_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active school tenant.",
            )

        check_school_access(
            current_user,
            school_id,
        )

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
            .join(
                School,
                School.id == Student.school_id,
            )
            .outerjoin(
                Classroom,
                Classroom.id == Student.classroom_id,
            )
            .outerjoin(
                SchoolBranding,
                SchoolBranding.school_id == Student.school_id,
            )
            .where(
                Student.id == student_id,
                Student.school_id == school_id,
            )
        )

        student_row = student_query.first()

        if not student_row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found",
            )

        student = student_row[0]

        viewer_is_class_teacher = False

        role_name_for_report = (
            getattr(
                getattr(current_user, "role", None),
                "name",
                None,
            )
            or getattr(current_user, "role", None)
            or ""
        )
        role_name_for_report = str(
            role_name_for_report
        ).upper()

        if role_name_for_report == "TEACHER":
            teacher_profile = getattr(
                current_user,
                "teacher",
                None,
            )

            if teacher_profile is None:
                from app.models.teacher import Teacher

                teacher_result = await self.db.execute(
                    select(Teacher.id).where(
                        Teacher.user_id == current_user.id,
                        Teacher.school_id == school_id,
                    )
                )

                teacher_id = teacher_result.scalar_one_or_none()
            else:
                teacher_id = teacher_profile.id

            viewer_is_class_teacher = bool(
                teacher_id
                and getattr(
                    student,
                    "classroom_id",
                    None,
                ) is not None
            )

            if viewer_is_class_teacher:
                classroom_result = await self.db.execute(
                    select(Classroom.class_teacher_id).where(
                        Classroom.id == student.classroom_id,
                        Classroom.school_id == school_id,
                    )
                )

                class_teacher_id = (
                    classroom_result.scalar_one_or_none()
                )

                viewer_is_class_teacher = (
                    class_teacher_id == teacher_id
                )

        report_filters = [
            Result.student_id == student_id,
            Result.school_id == school_id,
            Result.is_active == True,
        ]

        # Student delivery can explicitly request the exact
        # published report-card scope.
        #
        # Existing Admin report-card calls do not provide these
        # optional values, so their existing behavior is preserved.
        if (
            report_class_id is not None
            and report_term_id is not None
            and report_session_id is not None
        ):
            report_filters.extend(
                [
                    Result.class_id == int(report_class_id),
                    Result.term_id == int(report_term_id),
                    Result.academic_session_id == int(report_session_id),
                    Result.is_published == True,
                ]
            )

        result_query = await self.db.execute(
            select(
                Result,
                Subject.name.label("subject_name"),
            )
            .outerjoin(
                Subject,
                Subject.id == Result.subject_id,
            )
            .where(*report_filters)
            .order_by(Result.id.asc())
        )

        results_rows = result_query.all()
        # ----------------------------------------------------
        # REPORT CARD PUBLICATION GATE
        # ----------------------------------------------------
        # Students and parents must never receive unpublished
        # result rows. School administrators and teachers still
        # retain their existing report-card access.
        role_name = (
            getattr(getattr(current_user, "role", None), "name", None)
            or getattr(current_user, "role", None)
            or ""
        )
        role_name = str(role_name).upper()

        if role_name in {"STUDENT", "PARENT"}:
            results_rows = [
                row
                for row in results_rows
                if getattr(row[0], "is_published", False) is True
            ]

            if not results_rows:
                raise HTTPException(
                    status_code=403,
                    detail="Your report card has not been published yet.",
                )


        if not results_rows:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No results found",
            )

        first_result = results_rows[0][0]

        subjects = []
        total_score = 0

        for item, subject_name in results_rows:
            grading = await self.get_grade_for_score(
                item.school_id,
                item.total_score,
            )

            subjects.append(
                {
                    "id": item.id,
                    "result_id": item.id,
                    "name": subject_name or "Unknown",
                    "ca": item.ca_score,
                    "exam": item.exam_score,
                    "total": item.total_score,
                    "grade": (
                        grading.grade
                        if grading
                        else item.grade
                    ),
                    "remark": (
                        grading.remark
                        if grading
                        else item.remark
                    ),
                    "teacher_comment": item.teacher_comment,
                    "principal_comment": (
                        item.principal_comment
                        if item.id == first_result.id
                        else None
                    ),
                    "is_published": getattr(
                        item,
                        "is_published",
                        False,
                    ),
                }
            )

            total_score += item.total_score

        average = (
            total_score / len(subjects)
            if subjects
            else 0
        )

        position_query = await self.db.execute(
            select(
                Result.student_id,
                func.avg(Result.total_score).label("average"),
            )
            .where(
                Result.school_id == school_id,
                Result.class_id == first_result.class_id,
                Result.term_id == first_result.term_id,
                Result.academic_session_id
                == first_result.academic_session_id,
                Result.is_active == True,
            )
            .group_by(Result.student_id)
            .order_by(
                func.avg(Result.total_score).desc()
            )
        )

        ranking = position_query.all()
        position = None

        for index, row in enumerate(
            ranking,
            start=1,
        ):
            if row.student_id == student_id:
                position = index
                break

        present_query = await self.db.execute(
            select(func.count(Attendance.id)).where(
                Attendance.student_id == student_id,
                Attendance.school_id == school_id,
                Attendance.status == "present",
            )
        )

        present_days = present_query.scalar() or 0

        total_attendance_query = await self.db.execute(
            select(func.count(Attendance.id)).where(
                Attendance.student_id == student_id,
                Attendance.school_id == school_id,
            )
        )

        total_days = total_attendance_query.scalar() or 0

        attendance_percentage = (
            round(
                (present_days / total_days) * 100,
                2,
            )
            if total_days > 0
            else 0
        )

        session_query = await self.db.execute(
            select(AcademicSession.name).where(
                AcademicSession.id
                == first_result.academic_session_id
            )
        )

        session_name = (
            session_query.scalar_one_or_none()
        )

        term_query = await self.db.execute(
            select(Term.name).where(
                Term.id == first_result.term_id
            )
        )

        term_name = term_query.scalar_one_or_none()

        middle_name_str = (
            f"{student.middle_name} "
            if student.middle_name
            else ""
        )

        return {
            "session": session_name,
            "term": term_name,
            "student": {
                "name": (
                    f"{student.first_name} "
                    f"{middle_name_str}"
                    f"{student.last_name}"
                ),
                "admission_number":
                    student.admission_number,
                "passport":
                    getattr(student, "passport", None),
                "class": student_row.class_name,
            },
            "school": {
                "id": student.school_id,
                "name": student_row.school_name,
                "logo": (
                    student_row.logo_url
                    or student_row.school_logo
                ),
                "motto": student_row.motto,
                "primary_color":
                    student_row.primary_color,
                "secondary_color":
                    student_row.secondary_color,
                "accent_color":
                    student_row.accent_color,
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
            "viewer_is_class_teacher":
                viewer_is_class_teacher,
            "comments": {
                # Backward-compatible "teacher" key now points
                # to the report-level class teacher comment.
                "teacher":
                    first_result.class_teacher_comment,
                "class_teacher":
                    first_result.class_teacher_comment,
                "principal":
                    first_result.principal_comment,
            },
        }

    async def add_comment(
        self,
        result_id: int,
        payload,
        current_user,
        tenant,
    ):
        school_id = tenant.school_id

        if not school_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active school tenant.",
            )

        result = await self.repository.get_by_id(
            result_id,
            school_id,
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Result not found",
            )

        check_school_access(
            current_user,
            result.school_id,
        )

        role = current_user.role.name

        if role == "TEACHER":
            result.teacher_comment = payload.comment

            if hasattr(
                result,
                "teacher_comment_by",
            ):
                result.teacher_comment_by = (
                    current_user.id
                )

        elif role == "PRINCIPAL":
            result.principal_comment = payload.comment

            if hasattr(
                result,
                "principal_comment_by",
            ):
                result.principal_comment_by = (
                    current_user.id
                )

        elif role == "SCHOOL_ADMIN":
            if hasattr(
                result,
                "admin_comment",
            ):
                result.admin_comment = payload.comment

            if hasattr(
                result,
                "admin_comment_by",
            ):
                result.admin_comment_by = (
                    current_user.id
                )

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
        tenant,
        report_class_id: int | None = None,
        report_term_id: int | None = None,
        report_session_id: int | None = None,
    ):
        """
        Generate the student report card PDF.

        IMPORTANT:
        This function changes PDF presentation only.
        The existing Admin report-card page, publication logic,
        and report-data calculations are not changed.

        The PDF mirrors the approved Admin report-card structure:
        - school branding
        - logo + watermark
        - student passport/details
        - session/term/date
        - CA / Exam / Total / Grade / System Remark
        - aggregate / average / position
        - instructor/class-teacher comment
        - principal comment
        - signature area
        """

        report = await self.get_student_report(
            student_id,
            current_user,
            tenant,
            report_class_id=report_class_id,
            report_term_id=report_term_id,
            report_session_id=report_session_id,
        )

        from reportlab.lib import colors
        from reportlab.lib.colors import HexColor
        from reportlab.lib.enums import TA_CENTER, TA_LEFT
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
        from reportlab.lib.units import mm
        from reportlab.pdfbase.pdfmetrics import stringWidth
        from reportlab.platypus import (
            HRFlowable,
            Image as RLImage,
            KeepTogether,
            Paragraph,
            Spacer,
            Table,
            TableStyle,
            SimpleDocTemplate,
        )

        import io
        import os
        import urllib.request

        # --------------------------------------------------------
        # BRANDING
        # --------------------------------------------------------
        primary_value = (
            report.get("school", {}).get("primary_color")
            or "#1e3a8a"
        )

        accent_value = (
            report.get("school", {}).get("accent_color")
            or "#b45309"
        )

        try:
            primary = HexColor(primary_value)
        except Exception:
            primary = HexColor("#1e3a8a")

        try:
            accent = HexColor(accent_value)
        except Exception:
            accent = HexColor("#b45309")

        paper = HexColor("#fffdf9")
        page_background = HexColor("#f4f1ea")
        soft_background = HexColor("#faf8f5")
        line_color = HexColor("#cbd5e1")
        dark = HexColor("#0f172a")
        muted = HexColor("#64748b")

        buffer = io.BytesIO()

        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=15 * mm,
            leftMargin=15 * mm,
            topMargin=14 * mm,
            bottomMargin=14 * mm,
            title=f"Report Card - {report['student']['name']}",
            author=report["school"]["name"] or "CoreOne",
        )

        styles = getSampleStyleSheet()

        school_name_style = ParagraphStyle(
            "SchoolName",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=17,
            leading=20,
            textColor=primary,
            alignment=TA_LEFT,
            spaceAfter=3,
        )

        motto_style = ParagraphStyle(
            "Motto",
            parent=styles["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=8.5,
            leading=11,
            textColor=muted,
        )

        small_label_style = ParagraphStyle(
            "SmallLabel",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=6.5,
            leading=8,
            textColor=muted,
        )

        small_value_style = ParagraphStyle(
            "SmallValue",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8.5,
            leading=10,
            textColor=dark,
        )

        title_style = ParagraphStyle(
            "ReportTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=13,
            textColor=primary,
            alignment=TA_CENTER,
            spaceAfter=0,
        )

        body_style = ParagraphStyle(
            "Body",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            leading=10,
            textColor=dark,
        )

        italic_style = ParagraphStyle(
            "Italic",
            parent=body_style,
            fontName="Helvetica-Oblique",
            textColor=HexColor("#475569"),
        )

        section_label_style = ParagraphStyle(
            "SectionLabel",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=6.5,
            leading=8,
            textColor=primary,
            alignment=TA_LEFT,
        )

        # --------------------------------------------------------
        # IMAGE RESOLUTION
        # --------------------------------------------------------
        def resolve_image(value):
            if not value:
                return None

            raw = str(value).strip()

            if not raw:
                return None

            # Existing local upload path.
            candidates = []

            if raw.startswith("/uploads/"):
                candidates.append(raw.lstrip("/"))
                candidates.append(raw.replace("/uploads/", "uploads/").lstrip("/"))
            elif raw.startswith("uploads/"):
                candidates.append(raw)
            elif raw.startswith("/"):
                candidates.append(raw.lstrip("/"))
            else:
                candidates.append(raw)

            for candidate in candidates:
                if os.path.exists(candidate):
                    return candidate

            # Absolute URL fallback.
            if raw.startswith(("http://", "https://")):
                try:
                    response = urllib.request.urlopen(raw, timeout=10)
                    return io.BytesIO(response.read())
                except Exception:
                    return None

            # Render-host/public API fallback for relative URLs.
            api_base = os.getenv(
                "PUBLIC_API_URL",
                os.getenv(
                    "API_BASE_URL",
                    "https://coreone.onrender.com",
                ),
            ).rstrip("/")

            if raw.startswith("/"):
                remote_url = f"{api_base}{raw}"
            else:
                remote_url = f"{api_base}/{raw}"

            try:
                response = urllib.request.urlopen(
                    remote_url,
                    timeout=10,
                )
                return io.BytesIO(response.read())
            except Exception:
                return None

        # --------------------------------------------------------
        # PAGE BORDER / BACKGROUND
        # --------------------------------------------------------
        def draw_page(canvas, doc_obj):
            canvas.saveState()

            width, height = A4

            # Warm document background.
            canvas.setFillColor(page_background)
            canvas.rect(
                0,
                0,
                width,
                height,
                stroke=0,
                fill=1,
            )

            # Main report sheet.
            sheet_left = 9 * mm
            sheet_bottom = 9 * mm
            sheet_width = width - 18 * mm
            sheet_height = height - 18 * mm

            canvas.setFillColor(paper)
            canvas.roundRect(
                sheet_left,
                sheet_bottom,
                sheet_width,
                sheet_height,
                2 * mm,
                stroke=0,
                fill=1,
            )

            # Double-style school-colour border.
            canvas.setStrokeColor(primary)
            canvas.setLineWidth(2.2)
            canvas.rect(
                sheet_left,
                sheet_bottom,
                sheet_width,
                sheet_height,
                stroke=1,
                fill=0,
            )

            canvas.setLineWidth(0.8)
            canvas.rect(
                sheet_left + 3 * mm,
                sheet_bottom + 3 * mm,
                sheet_width - 6 * mm,
                sheet_height - 6 * mm,
                stroke=1,
                fill=0,
            )

            # Corner flourishes.
            canvas.setStrokeColor(primary)
            canvas.setLineWidth(1.1)

            corner_offset = 5 * mm
            corner_len = 7 * mm

            # Top-left.
            x = sheet_left + corner_offset
            y = height - sheet_bottom - corner_offset
            canvas.line(x, y, x + corner_len, y)
            canvas.line(x, y, x, y - corner_len)

            # Top-right.
            x = width - sheet_left - corner_offset
            y = height - sheet_bottom - corner_offset
            canvas.line(x, y, x - corner_len, y)
            canvas.line(x, y, x, y - corner_len)

            # Bottom-left.
            x = sheet_left + corner_offset
            y = sheet_bottom + corner_offset
            canvas.line(x, y, x + corner_len, y)
            canvas.line(x, y, x, y + corner_len)

            # Bottom-right.
            x = width - sheet_left - corner_offset
            y = sheet_bottom + corner_offset
            canvas.line(x, y, x - corner_len, y)
            canvas.line(x, y, x, y + corner_len)

            # Very light watermark.
            logo = resolve_image(
                report.get("school", {}).get("logo")
            )

            if logo:
                try:
                    canvas.saveState()
                    canvas.setFillAlpha(0.035)
                    canvas.drawImage(
                        logo,
                        width / 2 - 48 * mm,
                        height / 2 - 48 * mm,
                        width=96 * mm,
                        height=96 * mm,
                        preserveAspectRatio=True,
                        mask="auto",
                        anchor="c",
                    )
                    canvas.restoreState()
                except Exception:
                    canvas.restoreState()

            canvas.restoreState()

        # --------------------------------------------------------
        # HEADER
        # --------------------------------------------------------
        elements = []

        logo = resolve_image(
            report.get("school", {}).get("logo")
        )

        header_left = []

        if logo:
            try:
                school_logo = RLImage(
                    logo,
                    width=24 * mm,
                    height=24 * mm,
                )
                header_left.append(
                    school_logo
                )
            except Exception:
                pass

        school_text = [
            Paragraph(
                report["school"]["name"] or "School Name",
                school_name_style,
            )
        ]

        if report["school"].get("motto"):
            school_text.append(
                Paragraph(
                    report["school"]["motto"],
                    motto_style,
                )
            )

        if header_left:
            left_table = Table(
                [
                    [
                        header_left[0],
                        school_text,
                    ]
                ],
                colWidths=[
                    29 * mm,
                    95 * mm,
                ],
                hAlign="LEFT",
            )
        else:
            left_table = Table(
                [[school_text]],
                colWidths=[124 * mm],
                hAlign="LEFT",
            )

        left_table.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                    ("TOPPADDING", (0, 0), (-1, -1), 0),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ]
            )
        )

        official_block = Table(
            [
                [
                    Paragraph(
                        "OFFICIAL RECORD",
                        ParagraphStyle(
                            "Official",
                            parent=small_label_style,
                            textColor=accent,
                            alignment=TA_CENTER,
                        ),
                    )
                ],
                [
                    Paragraph(
                        "TRANSCRIPT",
                        ParagraphStyle(
                            "Transcript",
                            parent=styles["Normal"],
                            fontName="Helvetica-Bold",
                            fontSize=10,
                            leading=12,
                            textColor=dark,
                            alignment=TA_CENTER,
                        ),
                    )
                ],
            ],
            colWidths=[39 * mm],
        )

        official_block.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 3),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 3),
                    ("TOPPADDING", (0, 0), (-1, -1), 1),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
                    (
                        "LINEBEFORE",
                        (0, 0),
                        (0, -1),
                        0.5,
                        line_color,
                    ),
                ]
            )
        )

        header = Table(
            [[left_table, official_block]],
            colWidths=[124 * mm, 42 * mm],
        )

        header.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                    ("TOPPADDING", (0, 0), (-1, -1), 0),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    (
                        "LINEBELOW",
                        (0, 0),
                        (-1, -1),
                        1.1,
                        primary,
                    ),
                ]
            )
        )

        elements.append(header)
        elements.append(Spacer(1, 4 * mm))

        # --------------------------------------------------------
        # SESSION / TERM / DATE
        # --------------------------------------------------------
        current_print_date = (
            report.get("date_printed")
            or __import__("datetime").datetime.now().strftime(
                "%B %d, %Y"
            )
        )

        meta = Table(
            [
                [
                    Paragraph("SESSION:", small_label_style),
                    Paragraph(
                        report.get("session") or "—",
                        small_value_style,
                    ),
                    Paragraph("TERM:", small_label_style),
                    Paragraph(
                        report.get("term") or "—",
                        small_value_style,
                    ),
                    Paragraph("DATE ISSUED:", small_label_style),
                    Paragraph(
                        current_print_date,
                        small_value_style,
                    ),
                ]
            ],
            colWidths=[
                15 * mm,
                40 * mm,
                12 * mm,
                40 * mm,
                20 * mm,
                39 * mm,
            ],
        )

        meta.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 2),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 2),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                    (
                        "LINEBELOW",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        line_color,
                    ),
                ]
            )
        )

        elements.append(meta)

        # --------------------------------------------------------
        # DOCUMENT TITLE
        # --------------------------------------------------------
        elements.append(Spacer(1, 3 * mm))

        title_table = Table(
            [
                [
                    Paragraph(
                        "TERMINAL REPORT CARD",
                        title_style,
                    )
                ]
            ],
            colWidths=[166 * mm],
        )

        title_table.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, -1),
                        HexColor("#f8fafc"),
                    ),
                    (
                        "LINEABOVE",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        line_color,
                    ),
                    (
                        "LINEBELOW",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        line_color,
                    ),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )

        elements.append(title_table)
        elements.append(Spacer(1, 4 * mm))

        # --------------------------------------------------------
        # STUDENT BIO
        # --------------------------------------------------------
        passport = resolve_image(
            report["student"].get("passport")
        )

        photo_cell = ""

        if passport:
            try:
                photo_cell = RLImage(
                    passport,
                    width=27 * mm,
                    height=27 * mm,
                )
            except Exception:
                photo_cell = ""
        else:
            photo_cell = Paragraph(
                "PHOTO<br/>ARCHIVE",
                ParagraphStyle(
                    "NoPhoto",
                    parent=small_label_style,
                    alignment=TA_CENTER,
                    textColor=HexColor("#94a3b8"),
                ),
            )

        bio = Table(
            [
                [
                    photo_cell,
                    Paragraph(
                        "<b>STUDENT'S FULL NAME</b><br/>"
                        f"{report['student']['name']}",
                        body_style,
                    ),
                    Paragraph(
                        "<b>ADMISSION REFERENCE</b><br/>"
                        f'<font color="{primary_value}">'
                        f"{report['student']['admission_number']}"
                        f"</font>",
                        body_style,
                    ),
                ],
                [
                    "",
                    Paragraph(
                        "<b>CLASS ASSIGNATION</b><br/>"
                        f"{report['student'].get('class') or '—'}",
                        body_style,
                    ),
                    Paragraph(
                        "<b>SESSION ATTENDANCE RATE</b><br/>"
                        f"{report['attendance']}% of academic days",
                        body_style,
                    ),
                ],
            ],
            colWidths=[
                35 * mm,
                65 * mm,
                66 * mm,
            ],
        )

        bio.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, -1),
                        soft_background,
                    ),
                    (
                        "BOX",
                        (0, 0),
                        (-1, -1),
                        0.6,
                        line_color,
                    ),
                    (
                        "INNERGRID",
                        (0, 0),
                        (-1, -1),
                        0.35,
                        HexColor("#e2e8f0"),
                    ),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )

        elements.append(bio)
        elements.append(Spacer(1, 5 * mm))

        # --------------------------------------------------------
        # ACADEMIC TABLE
        # --------------------------------------------------------
        academic_data = [
            [
                "SUBJECT COURSEWORK",
                "C.A.",
                "EXAM",
                "TOTAL",
                "GRADE",
                "SYSTEM REMARK",
            ]
        ]

        for item in report["subjects"]:
            academic_data.append(
                [
                    item["name"],
                    item["ca"],
                    item["exam"],
                    item["total"],
                    item["grade"] or "—",
                    item["remark"] or "—",
                ]
            )

        academic = Table(
            academic_data,
            colWidths=[
                52 * mm,
                17 * mm,
                17 * mm,
                18 * mm,
                16 * mm,
                46 * mm,
                ],
            repeatRows=1,
        )

        academic_style = [
            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                primary,
            ),
            (
                "TEXTCOLOR",
                (0, 0),
                (-1, 0),
                colors.white,
            ),
            (
                "FONTNAME",
                (0, 0),
                (-1, 0),
                "Helvetica-Bold",
            ),
            (
                "FONTSIZE",
                (0, 0),
                (-1, -1),
                7,
            ),
            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.45,
                HexColor("#cbd5e1"),
            ),
            (
                "BOX",
                (0, 0),
                (-1, -1),
                1,
                dark,
            ),
            (
                "ALIGN",
                (1, 0),
                (-1, -1),
                "CENTER",
            ),
            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "MIDDLE",
            ),
            (
                "LEFTPADDING",
                (0, 0),
                (-1, -1),
                4,
            ),
            (
                "RIGHTPADDING",
                (0, 0),
                (-1, -1),
                4,
            ),
            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                4,
            ),
            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                4,
            ),
        ]

        for row_index in range(1, len(academic_data)):
            if row_index % 2 == 0:
                academic_style.append(
                    (
                        "BACKGROUND",
                        (0, row_index),
                        (-1, row_index),
                        HexColor("#faf9f5"),
                    )
                )
            else:
                academic_style.append(
                    (
                        "BACKGROUND",
                        (0, row_index),
                        (-1, row_index),
                        colors.white,
                    )
                )

            academic_style.extend(
                [
                    (
                        "FONTNAME",
                        (0, row_index),
                        (0, row_index),
                        "Helvetica-Bold",
                    ),
                    (
                        "FONTNAME",
                        (3, row_index),
                        (3, row_index),
                        "Helvetica-Bold",
                    ),
                    (
                        "TEXTCOLOR",
                        (3, row_index),
                        (3, row_index),
                        primary,
                    ),
                    (
                        "FONTNAME",
                        (4, row_index),
                        (4, row_index),
                        "Helvetica-Bold",
                    ),
                    (
                        "TEXTCOLOR",
                        (4, row_index),
                        (4, row_index),
                        accent,
                    ),
                    (
                        "TEXTCOLOR",
                        (5, row_index),
                        (5, row_index),
                        muted,
                    ),
                ]
            )

        academic.setStyle(
            TableStyle(academic_style)
        )

        elements.append(academic)
        elements.append(Spacer(1, 4 * mm))

        # --------------------------------------------------------
        # SUMMARY
        # --------------------------------------------------------
        summary = Table(
            [
                [
                    Paragraph(
                        "AGGREGATE MARK",
                        small_label_style,
                    ),
                    Paragraph(
                        "CUMULATIVE AVERAGE",
                        small_label_style,
                    ),
                    Paragraph(
                        "ORDER OF MERIT",
                        small_label_style,
                    ),
                ],
                [
                    Paragraph(
                        str(report["total"]),
                        ParagraphStyle(
                            "Summary1",
                            parent=small_value_style,
                            fontSize=12,
                            textColor=primary,
                            alignment=TA_CENTER,
                        ),
                    ),
                    Paragraph(
                        f'{report["average"]}%',
                        ParagraphStyle(
                            "Summary2",
                            parent=small_value_style,
                            fontSize=12,
                            textColor=primary,
                            alignment=TA_CENTER,
                        ),
                    ),
                    Paragraph(
                        str(report["position"] or "—"),
                        ParagraphStyle(
                            "Summary3",
                            parent=small_value_style,
                            fontSize=12,
                            textColor=accent,
                            alignment=TA_CENTER,
                        ),
                    ),
                ],
            ],
            colWidths=[
                55 * mm,
                55 * mm,
                56 * mm,
            ],
        )

        summary.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, -1),
                        colors.white,
                    ),
                    (
                        "BACKGROUND",
                        (1, 0),
                        (1, -1),
                        HexColor("#faf9f5"),
                    ),
                    (
                        "BOX",
                        (0, 0),
                        (-1, -1),
                        1,
                        dark,
                    ),
                    (
                        "INNERGRID",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        dark,
                    ),
                    (
                        "ALIGN",
                        (0, 0),
                        (-1, -1),
                        "CENTER",
                    ),
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "MIDDLE",
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        5,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        5,
                    ),
                ]
            )
        )

        elements.append(summary)
        elements.append(Spacer(1, 5 * mm))

        # --------------------------------------------------------
        # COMMENTS
        # --------------------------------------------------------
        teacher_comment = (
            report["comments"].get("teacher")
            or "No formal performance note entered by the assigned instructor."
        )

        principal_comment = (
            report["comments"].get("principal")
            or report.get("remark")
            or "No administrative oversight statement declared."
        )

        comments = Table(
            [
                [
                    Paragraph(
                        "INSTRUCTOR ASSESSMENT REMARKS",
                        section_label_style,
                    )
                ],
                [
                    Paragraph(
                        f'"{teacher_comment}"',
                        italic_style,
                    )
                ],
                [
                    Paragraph(
                        "PRINCIPAL EXECUTIVE REVIEW",
                        section_label_style,
                    )
                ],
                [
                    Paragraph(
                        f'"{principal_comment}"',
                        italic_style,
                    )
                ],
            ],
            colWidths=[166 * mm],
        )

        comments.setStyle(
            TableStyle(
                [
                    (
                        "BOX",
                        (0, 0),
                        (-1, 1),
                        0.6,
                        HexColor("#cbd5e1"),
                    ),
                    (
                        "BOX",
                        (0, 2),
                        (-1, 3),
                        0.6,
                        HexColor("#cbd5e1"),
                    ),
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, 0),
                        colors.white,
                    ),
                    (
                        "BACKGROUND",
                        (0, 2),
                        (-1, 2),
                        colors.white,
                    ),
                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        7,
                    ),
                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        7,
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        5,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        5,
                    ),
                ]
            )
        )

        elements.append(
            KeepTogether(
                [
                    comments,
                    Spacer(1, 6 * mm),
                ]
            )
        )

        # --------------------------------------------------------
        # SIGNATURES
        # --------------------------------------------------------
        signature = Table(
            [
                [
                    "",
                    "",
                ],
                [
                    "CLASS INSTRUCTOR",
                    "SCHOOL PRINCIPAL",
                ],
                [
                    "SIGNATURE & STAMP",
                    "ENDORSEMENT SEAL",
                ],
            ],
            colWidths=[
                83 * mm,
                83 * mm,
            ],
            rowHeights=[
                11 * mm,
                5 * mm,
                4 * mm,
            ],
        )

        signature.setStyle(
            TableStyle(
                [
                    (
                        "LINEABOVE",
                        (0, 0),
                        (0, 0),
                        0,
                        colors.white,
                    ),
                    (
                        "LINEBELOW",
                        (0, 0),
                        (0, 0),
                        0.6,
                        HexColor("#94a3b8"),
                    ),
                    (
                        "LINEBELOW",
                        (1, 0),
                        (1, 0),
                        0.6,
                        HexColor("#94a3b8"),
                    ),
                    (
                        "FONTNAME",
                        (0, 1),
                        (-1, 1),
                        "Helvetica-Bold",
                    ),
                    (
                        "FONTSIZE",
                        (0, 1),
                        (-1, 1),
                        7,
                    ),
                    (
                        "FONTSIZE",
                        (0, 2),
                        (-1, 2),
                        5.5,
                    ),
                    (
                        "TEXTCOLOR",
                        (0, 1),
                        (-1, 1),
                        dark,
                    ),
                    (
                        "TEXTCOLOR",
                        (0, 2),
                        (-1, 2),
                        HexColor("#94a3b8"),
                    ),
                    (
                        "ALIGN",
                        (0, 0),
                        (-1, -1),
                        "CENTER",
                    ),
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "MIDDLE",
                    ),
                    (
                        "TOPPADDING",
                        (0, 1),
                        (-1, -1),
                        2,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 1),
                        (-1, -1),
                        2,
                    ),
                ]
            )
        )

        elements.append(signature)

        # --------------------------------------------------------
        # BUILD
        # --------------------------------------------------------
        doc.build(
            elements,
            onFirstPage=draw_page,
            onLaterPages=draw_page,
        )

        buffer.seek(0)

        return buffer

    async def create_bulk_results(
        self,
        payload: BulkResultEntryRequest,
        current_user,
        tenant,
    ):
        school_id = tenant.school_id

        if not school_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active school tenant.",
            )

        if payload.school_id != school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Result school does not match the active tenant.",
            )

        check_school_access(
            current_user,
            school_id,
        )

        await self._check_teacher_result_access(
            current_user=current_user,
            school_id=school_id,
            class_id=payload.class_id,
            subject_id=payload.subject_id,
            academic_session_id=payload.academic_session_id,
        )

        created = []

        for item in payload.results:
            total = (
                item.ca_score
                + item.exam_score
            )

            grading = await self.get_grade_for_score(
                school_id,
                total,
            )

            existing = (
                await self.repository.get_existing_result(
                    school_id,
                    item.student_id,
                    payload.class_id,
                    payload.subject_id,
                    payload.term_id,
                    payload.academic_session_id,
                )
            )

            if existing:
                existing.ca_score = (
                    item.ca_score
                )
                existing.exam_score = (
                    item.exam_score
                )
                existing.total_score = total
                existing.grade = (
                    grading.grade
                    if grading
                    else None
                )
                existing.remark = (
                    grading.remark
                    if grading
                    else None
                )

                created.append(
                    await self.repository.update(
                        existing
                    )
                )

            else:
                result = Result(
                    school_id=school_id,
                    student_id=item.student_id,
                    class_id=payload.class_id,
                    subject_id=payload.subject_id,
                    term_id=payload.term_id,
                    academic_session_id=(
                        payload.academic_session_id
                    ),
                    ca_score=item.ca_score,
                    exam_score=item.exam_score,
                    total_score=total,
                    grade=(
                        grading.grade
                        if grading
                        else None
                    ),
                    remark=(
                        grading.remark
                        if grading
                        else None
                    ),
                    is_active=True,
                )

                created.append(
                    await self.repository.create(
                        result
                    )
                )

        return created


# ============================================================
# COREONE - OFFICIAL RESULT COMMENT HELPERS
# NON-CBT
# ============================================================

async def save_teacher_result_comment(result, comment, user_id):
    comment = str(comment or "").strip()

    if not comment:
        raise ValueError("Teacher comment cannot be empty.")

    result.teacher_comment = comment

    if hasattr(result, "teacher_comment_by"):
        result.teacher_comment_by = user_id

    if hasattr(result, "is_published"):
        result.is_published = False

    if hasattr(result, "published_at"):
        result.published_at = None

    if hasattr(result, "published_by"):
        result.published_by = None

    if hasattr(result, "status"):
        result.status = "REVIEW"

    return result


async def save_principal_result_comment(result, comment, user_id):
    comment = str(comment or "").strip()

    if not comment:
        raise ValueError("Principal comment cannot be empty.")

    result.principal_comment = comment

    if hasattr(result, "principal_comment_by"):
        result.principal_comment_by = user_id

    if hasattr(result, "is_published"):
        result.is_published = False

    if hasattr(result, "published_at"):
        result.published_at = None

    if hasattr(result, "published_by"):
        result.published_by = None

    if hasattr(result, "status"):
        result.status = "REVIEW"

    return result

# ============================================================
# COREONE - REPORT-LEVEL CLASS TEACHER COMMENT
# NON-CBT
# ============================================================

async def save_class_teacher_result_comment(
    result,
    comment,
    user_id,
):
    comment = str(comment or "").strip()

    if not comment:
        raise ValueError(
            "Class teacher comment cannot be empty."
        )

    result.class_teacher_comment = comment

    if hasattr(result, "is_published"):
        result.is_published = False

    if hasattr(result, "published_at"):
        result.published_at = None

    if hasattr(result, "published_by"):
        result.published_by = None

    if hasattr(result, "status"):
        result.status = "REVIEW"

    return result
