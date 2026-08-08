from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.reports.schemas import ReportsResponse
from app.modules.reports.service import ReportsService


router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


@router.get(
    "",
    response_model=ReportsResponse,
)
async def get_reports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ReportsService(db).get_reports()