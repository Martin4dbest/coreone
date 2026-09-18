from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.dashboard.schemas import DashboardResponse
from app.modules.dashboard.service import DashboardService


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get(
    "",
    response_model=DashboardResponse,
)
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await DashboardService(
        db
    ).get_dashboard(
        current_user
    )
# COREONE SCHOOL 360 LIVE ANALYTICS

from fastapi import Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.dashboard.school_360 import School360Service


@router.get("/school-360")
async def get_school_360_dashboard(
    school_id: int = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    role_name = getattr(
        getattr(current_user, "role", None),
        "name",
        None,
    )

    if role_name != "SUPER_ADMIN":
        if getattr(current_user, "school_id", None) != school_id:
            raise HTTPException(
                status_code=403,
                detail="You cannot view another school's dashboard",
            )

    return await School360Service(db).get(school_id)
