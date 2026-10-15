from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_roles
from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.dashboard.schemas import DashboardResponse
from app.modules.dashboard.service import DashboardService
from app.modules.dashboard.school_360 import School360Service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardResponse)
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")
    ),
):
    return await DashboardService(db).get_dashboard(current_user)


@router.get("/school-360")
async def get_school_360_dashboard(
    school_id: int = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role_name = getattr(
        getattr(current_user, "role", None),
        "name",
        None,
    )
    if role_name == "SUPER_ADMIN":
        pass
    elif role_name == "SCHOOL_ADMIN":
        if getattr(current_user, "school_id", None) != school_id:
            raise HTTPException(
                status_code=403,
                detail="You cannot view another school's dashboard",
            )
    else:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to view School 360 analytics",
        )
    return await School360Service(db).get(school_id)
