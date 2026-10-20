from datetime import datetime, timezone
from html import escape
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.staff import Staff
from app.models.staff_appraisal import StaffAppraisal
from app.models.teacher import Teacher
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.school_features.service import SchoolFeatureService
from app.modules.staff_appraisal.schemas import (
    CATEGORY_WEIGHTS,
    StaffAppraisalCreate,
    StaffAppraisalResponse,
    StaffAppraisalUpdate,
)

router = APIRouter(prefix="/staff-appraisal", tags=["Staff Appraisal"])

REVIEWER_ROLES = {"SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"}
SELF_ROLES = {"TEACHER", "STAFF"}
CATEGORY_LABELS = {
    "subject_performance": "Subject Performance",
    "cbt_assessment": "CBT and Assessment Outcomes",
    "attendance_punctuality": "Attendance and Punctuality",
    "classroom_professionalism": "Classroom Management and Professionalism",
    "improvement_development": "Improvement and Development",
}


def role_name(user: User) -> str:
    role = getattr(user, "role", None)
    return str(getattr(role, "name", role) or "").upper()


def calculate_weighted_score(ratings: dict) -> float | None:
    valid = {
        key: value
        for key, value in (ratings or {}).items()
        if key in CATEGORY_WEIGHTS
        and isinstance(value, int)
        and not isinstance(value, bool)
        and 1 <= value <= 5
    }
    if not valid:
        return None

    # Convert each 1–5 rating to a percentage and normalize by
    # the weights for categories with available ratings only.
    available_weight = sum(CATEGORY_WEIGHTS[key] for key in valid)
    score = sum(
        (valid[key] / 5) * CATEGORY_WEIGHTS[key]
        for key in valid
    ) / available_weight * 100
    return round(score, 2)


async def ensure_feature(db: AsyncSession, school_id: int) -> None:
    await SchoolFeatureService(db).ensure_enabled(school_id, "staff_appraisal")


async def resolve_reviewer_school(
    user: User,
    requested_school_id: int | None,
) -> int:
    role = role_name(user)

    if role not in REVIEWER_ROLES:
        raise HTTPException(
            status_code=403,
            detail="Only authorized school leadership can manage appraisals.",
        )

    if role == "SUPER_ADMIN":
        if not requested_school_id:
            raise HTTPException(
                status_code=422,
                detail="school_id is required for Super Admin appraisal requests.",
            )
        return requested_school_id

    if requested_school_id and requested_school_id != user.school_id:
        raise HTTPException(status_code=403, detail="You can only access your own school.")

    return int(user.school_id)


async def get_appraisal_for_school(
    db: AsyncSession,
    appraisal_id: int,
    school_id: int,
) -> StaffAppraisal:
    appraisal = await db.get(StaffAppraisal, appraisal_id)
    if appraisal is None or appraisal.school_id != school_id:
        raise HTTPException(status_code=404, detail="Appraisal not found.")
    return appraisal


async def get_linked_staff(
    db: AsyncSession,
    user: User,
) -> tuple[Staff, Teacher]:
    staff_result = await db.execute(
        select(Staff).where(
            Staff.user_id == user.id,
            Staff.user.has(school_id=user.school_id),
        )
    )
    staff = staff_result.scalars().first()

    teacher_result = await db.execute(
        select(Teacher).where(
            Teacher.user_id == user.id,
            Teacher.school_id == user.school_id,
        )
    )
    teacher = teacher_result.scalars().first()

    if staff is None or teacher is None:
        raise HTTPException(
            status_code=403,
            detail="Staff Appraisal is available only to staff linked to a teacher profile.",
        )

    return staff, teacher


@router.get("/me", response_model=list[StaffAppraisalResponse])
async def list_my_appraisals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if role_name(current_user) not in SELF_ROLES:
        raise HTTPException(status_code=403, detail="This endpoint is for linked staff members.")

    staff, teacher = await get_linked_staff(db, current_user)
    await ensure_feature(db, current_user.school_id)

    result = await db.execute(
        select(StaffAppraisal)
        .where(
            StaffAppraisal.school_id == current_user.school_id,
            StaffAppraisal.staff_id == staff.id,
            StaffAppraisal.teacher_id == teacher.id,
            StaffAppraisal.status == "APPROVED",
        )
        .order_by(StaffAppraisal.period_start.desc(), StaffAppraisal.id.desc())
    )
    return list(result.scalars().all())


@router.get("", response_model=list[StaffAppraisalResponse])
async def list_school_appraisals(
    school_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resolved_school_id = await resolve_reviewer_school(current_user, school_id)
    await ensure_feature(db, resolved_school_id)

    result = await db.execute(
        select(StaffAppraisal)
        .where(StaffAppraisal.school_id == resolved_school_id)
        .order_by(StaffAppraisal.period_start.desc(), StaffAppraisal.id.desc())
    )
    return list(result.scalars().all())


@router.post(
    "",
    response_model=StaffAppraisalResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_appraisal(
    payload: StaffAppraisalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    school_id = await resolve_reviewer_school(current_user, payload.school_id)
    await ensure_feature(db, school_id)

    staff_result = await db.execute(
        select(Staff).where(
            Staff.id == payload.staff_id,
            Staff.user.has(school_id=school_id),
        )
    )
    staff = staff_result.scalars().first()

    if staff is None:
        raise HTTPException(status_code=404, detail="Staff member not found in this school.")

    teacher_result = await db.execute(
        select(Teacher).where(
            Teacher.user_id == staff.user_id,
            Teacher.school_id == school_id,
        )
    )
    teacher = teacher_result.scalars().first()

    if teacher is None:
        raise HTTPException(
            status_code=422,
            detail="This staff member has not been linked to a teacher profile.",
        )

    existing = await db.execute(
        select(StaffAppraisal).where(
            StaffAppraisal.school_id == school_id,
            StaffAppraisal.staff_id == staff.id,
            StaffAppraisal.period_start == payload.period_start,
            StaffAppraisal.period_end == payload.period_end,
        )
    )
    if existing.scalars().first():
        raise HTTPException(
            status_code=409,
            detail="An appraisal already exists for this staff member and review period.",
        )

    appraisal = StaffAppraisal(
        school_id=school_id,
        staff_id=staff.id,
        teacher_id=teacher.id,
        period_start=payload.period_start,
        period_end=payload.period_end,
        category_ratings=payload.category_ratings,
        category_evidence=payload.category_evidence,
        overall_comments=payload.overall_comments,
        strengths=payload.strengths,
        improvement_plan=payload.improvement_plan,
        development_targets=payload.development_targets,
        weighted_score=calculate_weighted_score(payload.category_ratings),
        status="DRAFT",
        created_by=current_user.id,
    )
    db.add(appraisal)
    await db.commit()
    await db.refresh(appraisal)
    return appraisal


@router.patch("/{appraisal_id}", response_model=StaffAppraisalResponse)
async def update_appraisal(
    appraisal_id: int,
    payload: StaffAppraisalUpdate,
    school_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resolved_school_id = await resolve_reviewer_school(current_user, school_id)
    await ensure_feature(db, resolved_school_id)
    appraisal = await get_appraisal_for_school(db, appraisal_id, resolved_school_id)

    if appraisal.status == "APPROVED":
        raise HTTPException(status_code=409, detail="Approved appraisals cannot be edited.")

    changes = payload.model_dump(exclude_unset=True)
    for key, value in changes.items():
        setattr(appraisal, key, value)

    appraisal.weighted_score = calculate_weighted_score(appraisal.category_ratings)
    appraisal.status = "DRAFT"
    appraisal.approved_by = None
    appraisal.approved_at = None

    await db.commit()
    await db.refresh(appraisal)
    return appraisal


@router.post("/{appraisal_id}/approve", response_model=StaffAppraisalResponse)
async def approve_appraisal(
    appraisal_id: int,
    school_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resolved_school_id = await resolve_reviewer_school(current_user, school_id)
    await ensure_feature(db, resolved_school_id)
    appraisal = await get_appraisal_for_school(db, appraisal_id, resolved_school_id)

    if appraisal.created_by == current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You cannot approve an appraisal you created yourself.",
        )

    if not appraisal.category_ratings:
        raise HTTPException(
            status_code=422,
            detail="At least one category must have a valid rating before approval.",
        )

    appraisal.weighted_score = calculate_weighted_score(appraisal.category_ratings)
    appraisal.status = "APPROVED"
    appraisal.approved_by = current_user.id
    appraisal.approved_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(appraisal)
    return appraisal


@router.get("/{appraisal_id}/pdf")
async def download_appraisal_pdf(
    appraisal_id: int,
    school_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = role_name(current_user)

    if role in REVIEWER_ROLES:
        resolved_school_id = await resolve_reviewer_school(current_user, school_id)
        await ensure_feature(db, resolved_school_id)
        appraisal = await get_appraisal_for_school(db, appraisal_id, resolved_school_id)
    else:
        if role not in SELF_ROLES:
            raise HTTPException(status_code=403, detail="You cannot access this appraisal.")
        staff, teacher = await get_linked_staff(db, current_user)
        await ensure_feature(db, current_user.school_id)
        appraisal = await get_appraisal_for_school(db, appraisal_id, current_user.school_id)
        if appraisal.staff_id != staff.id or appraisal.teacher_id != teacher.id:
            raise HTTPException(status_code=403, detail="You cannot access this appraisal.")

    if appraisal.status != "APPROVED":
        raise HTTPException(
            status_code=403,
            detail="Only approved appraisals can be downloaded by PDF.",
        )

    staff = await db.get(Staff, appraisal.staff_id)
    teacher = await db.get(Teacher, appraisal.teacher_id)
    buffer = BytesIO()
    styles = getSampleStyleSheet()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=42,
        leftMargin=42,
        topMargin=42,
        bottomMargin=42,
    )

    elements = [
        Paragraph("COREONE STAFF APPRAISAL", styles["Title"]),
        Spacer(1, 10),
        Paragraph(
            f"Staff member: {escape(str(staff.first_name or ''))} "
            f"{escape(str(staff.last_name or ''))}",
            styles["Normal"],
        ),
        Paragraph(
            f"Employee number: {escape(str(staff.employee_number or 'Unavailable'))}",
            styles["Normal"],
        ),
        Paragraph(
            f"Review period: {appraisal.period_start.isoformat()} to {appraisal.period_end.isoformat()}",
            styles["Normal"],
        ),
        Paragraph(f"Status: {appraisal.status}", styles["Normal"]),
        Spacer(1, 14),
    ]

    from reportlab.lib.styles import ParagraphStyle

    header_style = ParagraphStyle("AppraisalTableHeader", parent=styles["BodyText"], fontName="Helvetica-Bold", fontSize=8, leading=10, textColor=colors.white, wordWrap="CJK")
    cell_style = ParagraphStyle("AppraisalTableCell", parent=styles["BodyText"], fontSize=8, leading=10, wordWrap="CJK")
    rows = [[Paragraph("Category", header_style), Paragraph("Weight", header_style), Paragraph("Rating", header_style), Paragraph("Evidence", header_style)]]
    for key, weight in CATEGORY_WEIGHTS.items():
        rating = appraisal.category_ratings.get(key)
        evidence = appraisal.category_evidence.get(key, "")
        evidence_text = escape(str(evidence or "Unavailable")).replace(chr(10), "<br/>")
        rows.append([Paragraph(escape(CATEGORY_LABELS[key]), cell_style), Paragraph(f"{weight}%", cell_style), Paragraph(f"{rating}/5" if rating is not None else "Unavailable", cell_style), Paragraph(evidence_text, cell_style)])
    table = Table(rows, colWidths=[135, 45, 48, 270], repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#172554")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(table)
    elements.extend([
        Spacer(1, 12),
        Paragraph(
            f"Weighted score: {appraisal.weighted_score:.2f}%"
            if appraisal.weighted_score is not None
            else "Weighted score: Unavailable",
            styles["Heading3"],
        ),
    ])

    for label, value in [
        ("Overall comments", appraisal.overall_comments),
        ("Strengths", appraisal.strengths),
        ("Improvement plan", appraisal.improvement_plan),
        ("Development targets", appraisal.development_targets),
    ]:
        elements.extend([
            Spacer(1, 8),
            Paragraph(label, styles["Heading3"]),
            Paragraph(str(value or "Not provided").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"), styles["BodyText"]),
        ])

    elements.extend([
        Spacer(1, 14),
        Paragraph(
            f"Approved at: {appraisal.approved_at.isoformat() if appraisal.approved_at else 'Unavailable'}",
            styles["Normal"],
        ),
    ])

    doc.build(elements)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="staff-appraisal-{appraisal.id}.pdf"'
        },
    )


@router.get("/eligible-staff")
async def list_eligible_staff(
    school_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resolved_school_id = await resolve_reviewer_school(
        current_user, school_id
    )
    await ensure_feature(db, resolved_school_id)

    result = await db.execute(
        select(
            Staff.id.label("staff_id"),
            Staff.first_name,
            Staff.last_name,
            Staff.employee_number,
            Teacher.id.label("teacher_id"),
        )
        .join(Teacher, Teacher.user_id == Staff.user_id)
        .join(User, User.id == Staff.user_id)
        .where(
            User.school_id == resolved_school_id,
            Teacher.school_id == resolved_school_id,
        )
        .order_by(Staff.last_name, Staff.first_name)
    )

    return [
        {
            "staff_id": row.staff_id,
            "first_name": row.first_name,
            "last_name": row.last_name,
            "employee_number": row.employee_number,
            "teacher_id": row.teacher_id,
        }
        for row in result.all()
    ]

from app.modules.staff_appraisal.evidence import router as evidence_router

router.include_router(evidence_router)
