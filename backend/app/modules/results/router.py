from fastapi import APIRouter, Depends, status, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db

from app.core.tenant.context import TenantContext
from app.core.tenant.dependencies import get_tenant_from_request

from app.models.user import User
from app.models.result import Result
from app.modules.auth.dependencies.current_user import get_current_user

from app.modules.results.schemas import (
    ResultCreateRequest,
    ResultUpdateRequest,
    BulkResultEntryRequest,
    ResultCommentRequest,
)

from app.modules.results.service import ResultService


router = APIRouter(
    prefix="/results",
    tags=["Results"],
)


# =========================================================
# COLLECTION / READ
# =========================================================

@router.get("", status_code=status.HTTP_200_OK)
async def get_results(
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    return await ResultService(db).get_results(
        current_user=current_user,
        tenant=tenant,
    )


@router.get("/teacher", status_code=status.HTTP_200_OK)
async def get_teacher_results(
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    return await ResultService(db).get_teacher_results(
        current_user,
        tenant,
    )


@router.get(
    "/student/{student_id}/report",
    status_code=status.HTTP_200_OK,
)
async def student_report(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    return await ResultService(db).get_student_report(
        student_id,
        current_user,
        tenant,
    )


@router.get(
    "/student/{student_id}/pdf",
    status_code=status.HTTP_200_OK,
)
async def student_report_pdf(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    pdf = await ResultService(db).generate_student_report_pdf(
        student_id,
        current_user,
        tenant,
    )

    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                "attachment; filename=student_report_card.pdf"
            )
        },
    )


# =========================================================
# CREATE / BULK
# =========================================================

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
async def create_result(
    payload: ResultCreateRequest,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    return await ResultService(db).create_result(
        payload,
        current_user,
        tenant,
    )


@router.post(
    "/bulk-entry",
    status_code=status.HTTP_200_OK,
)
async def bulk_entry(
    payload: BulkResultEntryRequest,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    return await ResultService(db).create_bulk_results(
        payload,
        current_user,
        tenant,
    )


# =========================================================
# DELETE ALL
# =========================================================

@router.delete(
    "",
    status_code=status.HTTP_200_OK,
)
async def delete_all_results(
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    return await ResultService(db).delete_all_results(
        current_user,
        tenant,
    )


# =========================================================
# SINGLE RESULT
# =========================================================

@router.get(
    "/{result_id}",
    status_code=status.HTTP_200_OK,
)
async def get_result(
    result_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    return await ResultService(db).get_result(
        result_id,
        current_user,
        tenant,
    )


@router.put(
    "/{result_id}",
    status_code=status.HTTP_200_OK,
)
async def update_result(
    result_id: int,
    payload: ResultUpdateRequest,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    return await ResultService(db).update_result(
        result_id,
        payload,
        current_user,
        tenant,
    )


@router.patch(
    "/{result_id}/comment",
    status_code=status.HTTP_200_OK,
)
async def add_result_comment(
    result_id: int,
    payload: ResultCommentRequest,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    return await ResultService(db).add_comment(
        result_id,
        payload,
        current_user,
        tenant,
    )


@router.delete(
    "/{result_id}",
    status_code=status.HTTP_200_OK,
)
async def delete_result(
    result_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    return await ResultService(db).delete_result(
        result_id,
        current_user,
        tenant,
    )

# ============================================================
# COREONE OFFICIAL RESULT COMMENTS
# ============================================================

@router.patch("/{result_id}/teacher-comment")
async def update_teacher_comment(
    result_id: int,
    payload: dict,
    current_user=Depends(get_current_user),
    tenant: TenantContext = Depends(get_tenant_from_request),
    db: AsyncSession = Depends(get_db),
):
    """
    SUBJECT-LEVEL TEACHER COMMENT

    A teacher enters the official comment only for the result/subject
    assigned to that teacher.

    Editing any teacher comment resets the ENTIRE student's report card
    to review status so it must be reviewed and published again.
    """

    from app.modules.results.service import save_teacher_result_comment

    role_name = (
        getattr(getattr(current_user, "role", None), "name", None)
        or getattr(current_user, "role", None)
        or ""
    )
    role_name = str(role_name).upper()

    if role_name != "TEACHER":
        raise HTTPException(
            status_code=403,
            detail="Only a teacher can enter a teacher comment.",
        )

    result_query = await db.execute(
        select(Result).where(
            Result.id == result_id,
            Result.school_id == tenant.school_id,
            Result.is_active == True,
        )
    )

    result = result_query.scalar_one_or_none()

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Result not found.",
        )

    comment = payload.get("comment")

    try:
        await save_teacher_result_comment(
            result,
            comment,
            getattr(current_user, "id", None),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    # Any teacher-comment edit reopens the WHOLE report card.
    report_query = await db.execute(
        select(Result).where(
            Result.student_id == result.student_id,
            Result.school_id == tenant.school_id,
            Result.is_active == True,
        )
    )
    report_rows = report_query.scalars().all()

    for row in report_rows:
        if hasattr(row, "is_published"):
            row.is_published = False
        if hasattr(row, "published_at"):
            row.published_at = None
        if hasattr(row, "published_by"):
            row.published_by = None
        if hasattr(row, "status"):
            row.status = "REVIEW"

    await db.commit()
    await db.refresh(result)

    return {
        "message": "Teacher comment saved successfully.",
        "result_id": result.id,
        "student_id": result.student_id,
        "teacher_comment": result.teacher_comment,
        "is_published": False,
    }


@router.patch("/student/{student_id}/principal-comment")
async def update_student_principal_comment(
    student_id: int,
    payload: dict,
    current_user=Depends(get_current_user),
    tenant: TenantContext = Depends(get_tenant_from_request),
    db: AsyncSession = Depends(get_db),
):
    """
    REPORT-CARD-LEVEL PRINCIPAL COMMENT

    ONE principal/head comment belongs to the COMPLETE student report card.

    It is stored on the report's anchor result for compatibility with the
    current schema, but it is NOT a subject comment.
    """

    role_name = (
        getattr(getattr(current_user, "role", None), "name", None)
        or getattr(current_user, "role", None)
        or ""
    )
    role_name = str(role_name).upper()

    if role_name not in {"SCHOOL_ADMIN", "PRINCIPAL", "SUPER_ADMIN"}:
        raise HTTPException(
            status_code=403,
            detail="Only the School Administrator or Principal can enter the report-card principal comment.",
        )

    query = await db.execute(
        select(Result)
        .where(
            Result.student_id == student_id,
            Result.school_id == tenant.school_id,
            Result.is_active == True,
        )
        .order_by(Result.id.asc())
    )

    rows = query.scalars().all()

    if not rows:
        raise HTTPException(
            status_code=404,
            detail="No result records were found for this student.",
        )

    anchor = rows[0]

    from app.modules.results.service import save_principal_result_comment

    comment = payload.get("comment")

    try:
        await save_principal_result_comment(
            anchor,
            comment,
            getattr(current_user, "id", None),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    # One principal comment controls the complete report card.
    for row in rows:
        if hasattr(row, "is_published"):
            row.is_published = False
        if hasattr(row, "published_at"):
            row.published_at = None
        if hasattr(row, "published_by"):
            row.published_by = None
        if hasattr(row, "status"):
            row.status = "REVIEW"

    await db.commit()
    await db.refresh(anchor)

    return {
        "message": "Principal report-card comment saved successfully.",
        "student_id": student_id,
        "principal_comment": anchor.principal_comment,
        "is_published": False,
    }


@router.post("/{result_id}/publish")
async def publish_result(
    result_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    PRINCIPAL / SCHOOL ADMIN ONLY

    Final publication gate.

    Teacher comment MUST exist.
    Principal comment MUST exist.
    """

    from app.modules.results.service import (
        publish_result_after_comment_validation,
    )

    result = await db.get(Result, result_id)

    if not result:
        raise HTTPException(status_code=404, detail="Result not found")

    role = str(
        getattr(current_user, "role", "")
    ).upper()

    if role not in {"SCHOOL_ADMIN", "SUPER_ADMIN", "PRINCIPAL"}:
        raise HTTPException(
            status_code=403,
            detail="Only the Principal or authorized School Administrator can publish results.",
        )

    try:
        await publish_result_after_comment_validation(result)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    await db.commit()
    await db.refresh(result)

    return {
        "message": "Result published successfully.",
        "result_id": result.id,
        "is_published": result.is_published,
        "published_at": result.published_at,
    }


@router.post("/{result_id}/unpublish")
async def unpublish_result(
    result_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    PRINCIPAL / SCHOOL ADMIN ONLY

    Allows an authorized administrator to return a published
    result to review status.
    """

    result = await db.get(Result, result_id)

    if not result:
        raise HTTPException(status_code=404, detail="Result not found")

    role = str(
        getattr(current_user, "role", "")
    ).upper()

    if role not in {"SCHOOL_ADMIN", "SUPER_ADMIN", "PRINCIPAL"}:
        raise HTTPException(
            status_code=403,
            detail="Only the Principal or authorized School Administrator can unpublish results.",
        )

    if hasattr(result, "is_published"):
        result.is_published = False

    if hasattr(result, "published_at"):
        result.published_at = None

    await db.commit()
    await db.refresh(result)

    return {
        "message": "Result returned to review.",
        "result_id": result.id,
        "is_published": False,
    }




# ============================================================
# COMPLETE REPORT CARD PUBLISH / UNPUBLISH
# ============================================================

@router.post("/student/{student_id}/publish")
async def publish_student_report_card(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    role_name = (
        getattr(getattr(current_user, "role", None), "name", None)
        or getattr(current_user, "role", None)
        or ""
    )
    role_name = str(role_name).upper()

    if role_name not in {"SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"}:
        raise HTTPException(
            status_code=403,
            detail="Only school administration can publish report cards.",
        )

    query = await db.execute(
        select(Result)
        .where(
            Result.student_id == student_id,
            Result.school_id == tenant.school_id,
            Result.is_active == True,
        )
        .order_by(Result.id.asc())
    )

    rows = query.scalars().all()

    if not rows:
        raise HTTPException(
            status_code=404,
            detail="No result records were found for this student.",
        )

    # Every subject/result must have its own teacher comment.
    missing_teacher = [
        r.id
        for r in rows
        if not (r.teacher_comment or "").strip()
    ]

    if missing_teacher:
        raise HTTPException(
            status_code=400,
            detail=(
                "Teacher comments are missing for one or more subjects. "
                "Every subject teacher must complete the subject comment "
                "before the report card can be published."
            ),
        )

    # ONE principal comment for the COMPLETE report card.
    anchor = rows[0]

    if not (anchor.principal_comment or "").strip():
        raise HTTPException(
            status_code=400,
            detail=(
                "The principal/head report-card comment is missing. "
                "The report card cannot be published yet."
            ),
        )

    from datetime import datetime, timezone

    now = datetime.now(timezone.utc)

    for result in rows:
        result.is_published = True
        result.published_at = now
        result.published_by = current_user.id
        result.status = "PUBLISHED"

    await db.commit()

    return {
        "message": "Student report card published successfully.",
        "student_id": student_id,
        "published_count": len(rows),
        "is_published": True,
        "published_at": now,
    }


@router.post("/student/{student_id}/unpublish")
async def unpublish_student_report_card(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(get_current_user),
):
    role_name = (
        getattr(getattr(current_user, "role", None), "name", None)
        or getattr(current_user, "role", None)
        or ""
    )
    role_name = str(role_name).upper()

    if role_name not in {"SUPER_ADMIN", "SCHOOL_ADMIN"}:
        raise HTTPException(
            status_code=403,
            detail="Only school administration can unpublish report cards.",
        )

    query = select(Result).where(
        Result.student_id == student_id,
        Result.school_id == tenant.school_id,
        Result.is_active == True,
    )

    rows = (await db.execute(query)).scalars().all()

    if not rows:
        raise HTTPException(
            status_code=404,
            detail="No result records were found for this student.",
        )

    for result in rows:
        result.is_published = False
        result.published_at = None
        result.status = "REVIEW"

    await db.commit()

    return {
        "message": "Student report card unpublished successfully.",
        "student_id": student_id,
        "unpublished_count": len(rows),
        "is_published": False,
    }
