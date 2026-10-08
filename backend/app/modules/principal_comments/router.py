from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.principal_comments.schemas import (
    PrincipalCommentBankApplyRequest,
    PrincipalCommentBankCreateRequest,
    PrincipalCommentBankResponse,
    PrincipalCommentBankUpdateRequest,
    PrincipalCommentPreviewResponse,
)
from app.modules.principal_comments.service import PrincipalCommentBankService


router = APIRouter(
    prefix="/principal-comments",
    tags=["Principal Comments"],
)


@router.get("/bank", response_model=list[PrincipalCommentBankResponse])
async def list_principal_comment_bank(
    school_id: int = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await PrincipalCommentBankService(db).list_banks(
        school_id,
        current_user,
    )


@router.post(
    "/bank",
    response_model=PrincipalCommentBankResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_principal_comment_bank(
    payload: PrincipalCommentBankCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await PrincipalCommentBankService(db).create_bank(
        payload,
        current_user,
    )


@router.patch(
    "/bank/{bank_id}",
    response_model=PrincipalCommentBankResponse,
)
async def update_principal_comment_bank(
    bank_id: int,
    payload: PrincipalCommentBankUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await PrincipalCommentBankService(db).update_bank(
        bank_id,
        payload,
        current_user,
    )


@router.delete("/bank/{bank_id}")
async def delete_principal_comment_bank(
    bank_id: int,
    school_id: int = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await PrincipalCommentBankService(db).delete_bank(
        bank_id,
        school_id,
        current_user,
    )


@router.get("/preview", response_model=PrincipalCommentPreviewResponse)
async def preview_principal_comment_application(
    school_id: int = Query(...),
    class_id: int = Query(...),
    term_id: int = Query(...),
    academic_session_id: int = Query(...),
    bank_id: int = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await PrincipalCommentBankService(db).preview(
        school_id,
        class_id,
        term_id,
        academic_session_id,
        bank_id,
        current_user,
    )


@router.post("/apply")
async def apply_principal_comment_application(
    payload: PrincipalCommentBankApplyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await PrincipalCommentBankService(db).apply(
        payload,
        current_user,
    )
