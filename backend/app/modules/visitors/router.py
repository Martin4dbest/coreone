from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.visitors.schemas import (
    VisitorCreateRequest,
    VisitorResponse,
)
from app.modules.visitors.service import VisitorService


router = APIRouter(
    prefix="/visitors",
    tags=["Visitors"],
)


@router.post(
    "",
    response_model=VisitorResponse,
)
async def create_visitor(
    payload: VisitorCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await VisitorService(db).create_visitor(payload)


@router.get(
    "",
    response_model=list[VisitorResponse],
)
async def get_visitors(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await VisitorService(db).get_visitors()


@router.get(
    "/{visitor_id}",
    response_model=VisitorResponse,
)
async def get_visitor(
    visitor_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await VisitorService(db).get_visitor(visitor_id)


@router.patch(
    "/{visitor_id}/checkout",
    response_model=VisitorResponse,
)
async def check_out_visitor(
    visitor_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await VisitorService(db).check_out_visitor(
        visitor_id
    )