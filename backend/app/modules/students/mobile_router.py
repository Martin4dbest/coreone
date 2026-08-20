from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.core.tenant.context import TenantContext
from app.core.tenant.dependencies import get_tenant_from_request
from app.models.user import User
from app.models.student import Student
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.results.service import ResultService
from app.modules.students.mobile_service import MobileStudentService
from app.modules.attendance.service import AttendanceService

router = APIRouter(
    prefix="/mobile/student",
    tags=["Mobile Student"],
)


@router.get("/dashboard")
async def dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await MobileStudentService(db).get_dashboard(current_user)


@router.get("/attendance")
async def student_attendance(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await AttendanceService(db).get_student_attendance(
        current_user
    )


@router.get("/results")
async def student_results(
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    student = (
        await db.execute(
            select(Student).where(Student.user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not student:
        return {
            "detail": "Student profile not found"
        }

    # --------------------------------------------------------
    # EXACT PUBLISHED REPORT DELIVERY
    #
    # The student receives the same report scope that the Admin
    # publication selected: class + term + academic session.
    #
    # Existing Admin report-card UI is untouched.
    # --------------------------------------------------------

    from app.models.result import Result

    published_result = await db.execute(
        select(Result)
        .where(
            Result.student_id == student.id,
            Result.school_id == tenant.school_id,
            Result.is_active == True,
            Result.is_published == True,
        )
        .order_by(
            Result.published_at.desc(),
            Result.id.desc(),
        )
        .limit(1)
    )

    published_anchor = published_result.scalar_one_or_none()

    if not published_anchor:
        raise HTTPException(
            status_code=403,
            detail="Your report card has not been published yet.",
        )

    return await ResultService(db).get_student_report(
        student.id,
        current_user,
        tenant,
        report_class_id=published_anchor.class_id,
        report_term_id=published_anchor.term_id,
        report_session_id=published_anchor.academic_session_id,
    )


@router.get("/results/pdf")
async def student_results_pdf(
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    student = (
        await db.execute(
            select(Student).where(Student.user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not student:
        return {
            "detail": "Student profile not found"
        }

    from app.models.result import Result

    published_result = await db.execute(
        select(Result)
        .where(
            Result.student_id == student.id,
            Result.school_id == tenant.school_id,
            Result.is_active == True,
            Result.is_published == True,
        )
        .order_by(
            Result.published_at.desc(),
            Result.id.desc(),
        )
        .limit(1)
    )

    published_anchor = published_result.scalar_one_or_none()

    if not published_anchor:
        raise HTTPException(
            status_code=403,
            detail="Your report card has not been published yet.",
        )

    pdf = await ResultService(db).generate_student_report_pdf(
        student.id,
        current_user,
        tenant,
        report_class_id=published_anchor.class_id,
        report_term_id=published_anchor.term_id,
        report_session_id=published_anchor.academic_session_id,
    )

    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=student_report_card.pdf"
        },
    )
