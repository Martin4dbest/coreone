from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.timetable.schemas import (
    TimetableCreateRequest,
    TimetableResponse,
    TimetableUpdateRequest,
)
from app.modules.timetable.service import TimetableService


router = APIRouter(
    prefix="/timetable",
    tags=["Timetable"],
)


@router.get(
    "",
    response_model=list[TimetableResponse],
)
async def list_timetable(
    school_id: int | None = Query(default=None),
    session_id: int | None = Query(default=None),
    term_id: int | None = Query(default=None),
    classroom_id: int | None = Query(default=None),
    teacher_id: int | None = Query(default=None),
    day_of_week: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TimetableService(db).list_timetable(
        current_user,
        school_id=school_id,
        session_id=session_id,
        term_id=term_id,
        classroom_id=classroom_id,
        teacher_id=teacher_id,
        day_of_week=day_of_week,
    )


@router.post(
    "",
    response_model=TimetableResponse,
)
async def create_timetable(
    payload: TimetableCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TimetableService(db).create_timetable(
        payload,
        current_user,
    )


@router.get(
    "/student/me",
    response_model=list[TimetableResponse],
)
async def student_timetable(
    day_of_week: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TimetableService(db).student_timetable(
        current_user,
        day_of_week=day_of_week,
    )


@router.get(
    "/teacher/me",
    response_model=list[TimetableResponse],
)
async def teacher_timetable(
    day_of_week: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TimetableService(db).teacher_timetable(
        current_user,
        day_of_week=day_of_week,
    )


@router.get(
    "/parent",
    response_model=list[TimetableResponse],
)
async def parent_timetable(
    student_id: int | None = Query(default=None),
    day_of_week: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TimetableService(db).parent_timetable(
        current_user,
        student_id=student_id,
        day_of_week=day_of_week,
    )


@router.get(
    "/{entry_id}",
    response_model=TimetableResponse,
)
async def get_timetable_entry(
    entry_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TimetableService(db).get_timetable_entry(
        entry_id,
        current_user,
    )


@router.patch(
    "/{entry_id}",
    response_model=TimetableResponse,
)
async def update_timetable(
    entry_id: int,
    payload: TimetableUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TimetableService(db).update_timetable(
        entry_id,
        payload,
        current_user,
    )


@router.delete(
    "/{entry_id}",
)
async def delete_timetable(
    entry_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TimetableService(db).delete_timetable(
        entry_id,
        current_user,
    )
