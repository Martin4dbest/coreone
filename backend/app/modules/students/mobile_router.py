from fastapi import APIRouter, Depends
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
async def get_student_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await MobileStudentService(
        db
    ).get_dashboard(current_user)
