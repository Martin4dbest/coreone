from fastapi import APIRouter, Depends, Query, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.responses import StreamingResponse
from app.modules.timetable.import_service import TimetableImportService, build_template

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.timetable.schemas import (
    TimetableCreateRequest,
    TimetablePublicationRequest,
    TimetablePublicationResponse,
    TimetableResponse,
    TimetableUpdateRequest,
)
from app.modules.timetable.service import TimetableService
from app.modules.timetable.publication_service import (
    TimetablePublicationService,
)


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


@router.post(
    "/publication",
    response_model=TimetablePublicationResponse,
)
async def publish_timetable(
    payload: TimetablePublicationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TimetablePublicationService(db).publish_timetable(
        payload,
        current_user,
    )


@router.get(
    "/publication",
    response_model=TimetablePublicationResponse,
)
async def get_timetable_publication(
    session_id: int = Query(...),
    term_id: int = Query(...),
    school_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TimetablePublicationService(db).get_publication(
        current_user,
        session_id=session_id,
        term_id=term_id,
        school_id=school_id,
    )


@router.post(
    "/publication/{session_id}/{term_id}/withdraw",
)
async def withdraw_timetable_publication(
    session_id: int,
    term_id: int,
    school_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TimetablePublicationService(db).withdraw_publication(
        current_user,
        session_id=session_id,
        term_id=term_id,
        school_id=school_id,
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
    return await TimetablePublicationService(db).student_timetable(
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
    return await TimetablePublicationService(db).teacher_timetable(
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
    return await TimetablePublicationService(db).parent_timetable(
        current_user,
        student_id=student_id,
        day_of_week=day_of_week,
    )


# Keep this static route ABOVE /{entry_id}.
@router.get("/import-template")
async def download_timetable_import_template(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.name not in {"SUPER_ADMIN", "SCHOOL_ADMIN"}:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=403,
            detail="Only School Admins can download the timetable template.",
        )

    output = build_template()

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": 'attachment; filename="timetable-import-template.xlsx"'
        },
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
    return await TimetablePublicationService(db).get_timetable_entry(
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


@router.post("/import")
async def import_timetable_entries(
    school_id: int = Query(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TimetableImportService(db).import_file(
        file,
        current_user,
        school_id,
    )


@router.post("/import/preview")
async def preview_timetable_import(
    school_id: int = Query(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TimetableImportService(db).preview_file(
        file,
        current_user,
        school_id,
    )
