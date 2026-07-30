from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user

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
    return await MobileStudentService(db).get_dashboard(
        current_user
    )


@router.get("/results")
async def student_results(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await MobileStudentService(db).get_results(
        current_user
    )


@router.get("/results/pdf")
async def student_results_pdf(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pdf = await MobileStudentService(db).get_results_pdf(
        current_user
    )

    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                "attachment; filename=student_report_card.pdf"
            )
        },
    )
