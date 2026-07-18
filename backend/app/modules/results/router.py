from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user

from app.modules.results.schemas import (
    ResultCreateRequest,
    ResultUpdateRequest,
    BulkResultEntryRequest,
    ResultResponse,
    ResultCommentRequest,
)

from app.modules.results.service import ResultService


router = APIRouter(
    prefix="/results",
    tags=["Results"],
)


@router.post("")
async def create_result(
    payload: ResultCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ResultService(db).create_result(
        payload,
        current_user,
    )


@router.put("/{result_id}")
async def update_result(
    result_id: int,
    payload: ResultUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ResultService(db).update_result(
        result_id,
        payload,
        current_user,
    )


@router.get("")
async def get_results(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ResultService(db).get_results(
        current_user
    )


@router.get("/{result_id}")
async def get_result(
    result_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ResultService(db).get_result(
        result_id
    )


@router.delete("/{result_id}")
async def delete_result(
    result_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ResultService(db).delete_result(
        result_id,
        current_user,
    )


@router.delete("")
async def delete_all_results(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ResultService(db).delete_all_results(
        current_user
    )




@router.get("/student/{student_id}/report")
async def student_report(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ResultService(db).get_student_report(
        student_id,
        current_user,
    )




@router.get("/student/{student_id}/pdf")
async def student_report_pdf(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    from fastapi.responses import StreamingResponse

    pdf = await ResultService(db).generate_student_report_pdf(
        student_id,
        current_user,
    )

    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
            "attachment; filename=student_report_card.pdf"
        },
    )

@router.post("/bulk-entry")
async def bulk_entry(
    payload: BulkResultEntryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ResultService(db).create_bulk_results(
        payload,
        current_user,
    )


@router.patch("/{result_id}/comment")
async def add_result_comment(
    result_id: int,
    payload: ResultCommentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ResultService(db).add_comment(
        result_id,
        payload,
        current_user,
    )
