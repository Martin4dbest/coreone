from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.departments.schemas import (
    DepartmentCreateRequest,
    DepartmentResponse,
)
from app.modules.departments.service import DepartmentService

router = APIRouter(
    prefix="/departments",
    tags=["Departments"],
)


@router.post(
    "",
    response_model=DepartmentResponse,
)
async def create_department(
    payload: DepartmentCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await DepartmentService(db).create_department(
        payload,
        current_user,
    )


@router.get(
    "",
    response_model=list[DepartmentResponse],
)
async def get_departments(
    school_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await DepartmentService(db).get_departments(
        current_user
    )


@router.get(
    "/{department_id}",
    response_model=DepartmentResponse,
)
async def get_department(
    department_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await DepartmentService(db).get_department(
        department_id,
        current_user,
    )
