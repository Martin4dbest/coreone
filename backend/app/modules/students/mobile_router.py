from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.models.user import User
from app.models.student import Student
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.results.service import ResultService
from app.modules.students.mobile_service import MobileStudentService

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


@router.get("/results")
async def student_results(
    db: AsyncSession = Depends(get_db),
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

    # EXACTLY the same service the admin dashboard uses
    return await ResultService(db).get_student_report(
        student.id,
        current_user,
    )


@router.get("/results/pdf")
async def student_results_pdf(
    db: AsyncSession = Depends(get_db),
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

    pdf = await ResultService(db).generate_student_report_pdf(
        student.id,
        current_user,
    )

    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=student_report_card.pdf"
        },
    )
