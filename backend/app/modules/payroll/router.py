import calendar
from datetime import date, datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_roles
from app.db.database import get_db
from app.models.payroll import PayrollItem, PayrollProfile, PayrollRule, PayrollRun
from app.models.staff import Staff
from app.models.user import User
from app.modules.school_features.service import SchoolFeatureService
from app.modules.payroll.schemas import (
    GeneratePayrollInput,
    MarkPayrollPaidInput,
    PayrollItemUpdate,
    PayrollProfileInput,
    PayrollRuleInput,
)

router = APIRouter(prefix="/payroll", tags=["Payroll"])
PAYROLL_ROLES = ("SUPER_ADMIN", "SCHOOL_ADMIN")
CENT = Decimal("0.01")
ZERO = Decimal("0.00")


def money(value) -> Decimal:
    return Decimal(str(value or 0)).quantize(CENT, rounding=ROUND_HALF_UP)


def sum_map(values: dict | None) -> Decimal:
    total = Decimal("0")
    for value in (values or {}).values():
        if isinstance(value, dict):
            value = value.get("amount", 0)
        total += Decimal(str(value or 0))
    return money(total)


def json_money(values: dict | None) -> dict:
    result = {}
    for key, value in (values or {}).items():
        amount = money(value)
        if amount < 0:
            raise HTTPException(status_code=422, detail=f"{key} cannot be negative.")
        result[str(key).strip()] = float(amount)
    return result


async def resolve_school_id(current_user: User, requested_school_id: int, db: AsyncSession) -> int:
    role_name = getattr(getattr(current_user, "role", None), "name", None)
    if role_name == "SUPER_ADMIN":
        return requested_school_id
    if role_name != "SCHOOL_ADMIN" or current_user.school_id != requested_school_id:
        raise HTTPException(status_code=403, detail="You cannot access payroll for this school.")
    feature = await SchoolFeatureService(db).repository.get(requested_school_id, "payroll")
    if feature is None or not feature.enabled:
        raise HTTPException(status_code=403, detail="Payroll is not enabled for this school.")
    return requested_school_id


def rule_snapshot_amounts(
    rules: list[PayrollRule], basic: Decimal, gross: Decimal
) -> dict:
    result = {}
    for rule in rules:
        base = gross if rule.basis == "GROSS" else basic
        rate = Decimal(str(rule.rate))
        amount = money(
            base * rate / Decimal("100")
            if rule.calculation == "PERCENTAGE"
            else rate
        )
        result[rule.code] = {
            "name": rule.name,
            "category": rule.category,
            "statutory": bool(rule.statutory),
            "calculation": rule.calculation,
            "basis": rule.basis,
            "rate": float(rate),
            "amount": float(amount),
        }
    return result


def calculate_item(item: PayrollItem) -> None:
    item.basic_salary = money(item.basic_salary)
    item.bonuses = money(item.bonuses)
    item.gross_pay = money(
        item.basic_salary + sum_map(item.allowances) + item.bonuses
    )

    # Preserve the rule snapshot on this payroll item. Changes to rules later
    # must not silently alter an already-generated payroll run.
    updated_rules = dict(item.rule_deductions or {})
    for entry in updated_rules.values():
        if not isinstance(entry, dict) or "rate" not in entry:
            continue
        base = (
            item.gross_pay
            if entry.get("basis") == "GROSS"
            else item.basic_salary
        )
        rate = Decimal(str(entry["rate"]))
        amount = money(
            base * rate / Decimal("100")
            if entry.get("calculation") == "PERCENTAGE"
            else rate
        )
        entry["amount"] = float(amount)

    item.rule_deductions = updated_rules
    item.total_deductions = money(
        sum_map(item.rule_deductions)
        + sum_map(item.recurring_deductions)
        + sum_map(item.other_deductions)
    )
    item.net_pay = money(item.gross_pay - item.total_deductions)


def item_dict(item: PayrollItem) -> dict:
    return {
        "id": item.id,
        "run_id": item.run_id,
        "staff_id": item.staff_id,
        "employee_number": item.employee_number,
        "staff_name": item.staff_name,
        "job_title": item.job_title,
        "basic_salary": float(item.basic_salary),
        "allowances": item.allowances or {},
        "bonuses": float(item.bonuses),
        "gross_pay": float(item.gross_pay),
        "rule_deductions": item.rule_deductions or {},
        "recurring_deductions": item.recurring_deductions or {},
        "other_deductions": item.other_deductions or {},
        "total_deductions": float(item.total_deductions),
        "net_pay": float(item.net_pay),
        "payment_status": item.payment_status,
        "payment_reference": item.payment_reference,
        "paid_at": item.paid_at.isoformat() if item.paid_at else None,
    }


def run_dict(run: PayrollRun) -> dict:
    return {
        "id": run.id,
        "school_id": run.school_id,
        "year": run.year,
        "month": run.month,
        "period": f"{run.year}-{run.month:02d}",
        "status": run.status,
        "total_gross": float(run.total_gross),
        "total_deductions": float(run.total_deductions),
        "total_net": float(run.total_net),
        "created_at": run.created_at.isoformat() if run.created_at else None,
        "approved_at": run.approved_at.isoformat() if run.approved_at else None,
    }


async def get_run(
    db: AsyncSession, run_id: int, school_id: int
) -> PayrollRun:
    result = await db.execute(
        select(PayrollRun).where(
            PayrollRun.id == run_id,
            PayrollRun.school_id == school_id,
        )
    )
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Payroll run not found.")
    return run


async def get_item(
    db: AsyncSession, item_id: int, school_id: int
) -> tuple[PayrollItem, PayrollRun]:
    result = await db.execute(
        select(PayrollItem, PayrollRun)
        .join(PayrollRun, PayrollItem.run_id == PayrollRun.id)
        .where(
            PayrollItem.id == item_id,
            PayrollRun.school_id == school_id,
        )
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Payroll item not found.")
    return row[0], row[1]


async def refresh_run_totals(db: AsyncSession, run: PayrollRun) -> None:
    result = await db.execute(
        select(PayrollItem).where(PayrollItem.run_id == run.id)
    )
    items = result.scalars().all()
    run.total_gross = money(sum((money(i.gross_pay) for i in items), Decimal("0")))
    run.total_deductions = money(
        sum((money(i.total_deductions) for i in items), Decimal("0"))
    )
    run.total_net = money(sum((money(i.net_pay) for i in items), Decimal("0")))


@router.get("/profiles")
async def list_profiles(
    school_id: int = Query(..., gt=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*PAYROLL_ROLES)),
):
    school_id = await resolve_school_id(current_user, school_id, db)
    result = await db.execute(
        select(PayrollProfile, Staff)
        .join(Staff, PayrollProfile.staff_id == Staff.id)
        .join(User, Staff.user_id == User.id)
        .where(
            PayrollProfile.school_id == school_id,
            User.school_id == school_id,
        )
        .order_by(Staff.last_name, Staff.first_name)
    )
    return [
        {
            "id": profile.id,
            "school_id": profile.school_id,
            "staff_id": profile.staff_id,
            "staff_name": " ".join(
                part for part in (
                    staff.first_name, staff.middle_name, staff.last_name
                ) if part
            ),
            "employee_number": staff.employee_number,
            "job_title": staff.job_title,
            "basic_salary": float(profile.basic_salary),
            "allowances": profile.allowances or {},
            "recurring_deductions": profile.recurring_deductions or {},
        }
        for profile, staff in result.all()
    ]


@router.put("/profiles")
async def upsert_profile(
    payload: PayrollProfileInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*PAYROLL_ROLES)),
):
    school_id = await resolve_school_id(current_user, payload.school_id, db)
    staff_result = await db.execute(
        select(Staff)
        .join(User, Staff.user_id == User.id)
        .where(
            Staff.id == payload.staff_id,
            User.school_id == school_id,
            User.is_active.is_(True),
        )
    )
    if not staff_result.scalar_one_or_none():
        raise HTTPException(
            status_code=404,
            detail="Active staff member not found in this school.",
        )

    result = await db.execute(
        select(PayrollProfile).where(
            PayrollProfile.school_id == school_id,
            PayrollProfile.staff_id == payload.staff_id,
        )
    )
    profile = result.scalar_one_or_none()
    if profile is None:
        profile = PayrollProfile(
            school_id=school_id,
            staff_id=payload.staff_id,
            created_by=current_user.id,
        )
        db.add(profile)

    profile.basic_salary = money(payload.basic_salary)
    profile.allowances = json_money(payload.allowances)
    profile.recurring_deductions = json_money(payload.recurring_deductions)
    profile.updated_by = current_user.id
    await db.commit()
    await db.refresh(profile)
    return {
        "message": "Salary profile saved.",
        "id": profile.id,
        "school_id": profile.school_id,
        "staff_id": profile.staff_id,
        "basic_salary": float(profile.basic_salary),
        "allowances": profile.allowances,
        "recurring_deductions": profile.recurring_deductions,
    }


@router.get("/rules")
async def list_rules(
    school_id: int = Query(..., gt=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*PAYROLL_ROLES)),
):
    school_id = await resolve_school_id(current_user, school_id, db)
    result = await db.execute(
        select(PayrollRule)
        .where(PayrollRule.school_id == school_id)
        .order_by(PayrollRule.effective_from.desc(), PayrollRule.name)
    )
    return [
        {
            "id": rule.id,
            "school_id": rule.school_id,
            "name": rule.name,
            "code": rule.code,
            "category": rule.category,
            "calculation": rule.calculation,
            "rate": float(rule.rate),
            "basis": rule.basis,
            "effective_from": rule.effective_from.isoformat(),
            "effective_to": (
                rule.effective_to.isoformat() if rule.effective_to else None
            ),
            "enabled": rule.enabled,
            "statutory": rule.statutory,
        }
        for rule in result.scalars().all()
    ]


@router.post("/rules")
async def create_rule(
    payload: PayrollRuleInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*PAYROLL_ROLES)),
):
    school_id = await resolve_school_id(current_user, payload.school_id, db)
    rule = PayrollRule(
        school_id=school_id,
        name=payload.name.strip(),
        code=payload.code.strip().upper(),
        category=payload.category,
        calculation=payload.calculation,
        rate=Decimal(str(payload.rate)),
        basis=payload.basis,
        effective_from=payload.effective_from,
        effective_to=payload.effective_to,
        enabled=payload.enabled,
        statutory=payload.statutory,
        created_by=current_user.id,
    )
    db.add(rule)
    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Could not save rule. Check its code and effective date.",
        )
    await db.refresh(rule)
    return {"message": "Payroll rule created.", "id": rule.id}


@router.put("/rules/{rule_id}")
async def update_rule(
    rule_id: int,
    payload: PayrollRuleInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*PAYROLL_ROLES)),
):
    school_id = await resolve_school_id(current_user, payload.school_id, db)
    result = await db.execute(
        select(PayrollRule).where(
            PayrollRule.id == rule_id,
            PayrollRule.school_id == school_id,
        )
    )
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Payroll rule not found.")

    rule.name = payload.name.strip()
    rule.code = payload.code.strip().upper()
    rule.category = payload.category
    rule.calculation = payload.calculation
    rule.rate = Decimal(str(payload.rate))
    rule.basis = payload.basis
    rule.effective_from = payload.effective_from
    rule.effective_to = payload.effective_to
    rule.enabled = payload.enabled
    rule.statutory = payload.statutory
    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Could not update payroll rule.")
    return {"message": "Payroll rule updated."}


@router.post("/runs/generate")
async def generate_payroll(
    payload: GeneratePayrollInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*PAYROLL_ROLES)),
):
    school_id = await resolve_school_id(current_user, payload.school_id, db)
    existing = await db.execute(
        select(PayrollRun).where(
            PayrollRun.school_id == school_id,
            PayrollRun.year == payload.year,
            PayrollRun.month == payload.month,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail="A payroll run already exists for this school and month.",
        )

    period_start = date(payload.year, payload.month, 1)
    period_end = date(
        payload.year,
        payload.month,
        calendar.monthrange(payload.year, payload.month)[1],
    )

    staff_result = await db.execute(
        select(Staff)
        .join(User, Staff.user_id == User.id)
        .where(User.school_id == school_id, User.is_active.is_(True))
        .order_by(Staff.last_name, Staff.first_name)
    )
    staff_members = staff_result.scalars().all()
    if not staff_members:
        raise HTTPException(status_code=400, detail="No active staff found for this school.")

    profile_result = await db.execute(
        select(PayrollProfile).where(PayrollProfile.school_id == school_id)
    )
    profiles = {p.staff_id: p for p in profile_result.scalars().all()}
    missing = [
        " ".join(p for p in (s.first_name, s.last_name) if p)
        for s in staff_members if s.id not in profiles
    ]
    if missing:
        preview = ", ".join(missing[:8])
        extra = f" and {len(missing) - 8} more" if len(missing) > 8 else ""
        raise HTTPException(
            status_code=400,
            detail=(
                "Set up salary profiles for all active staff before generating payroll. "
                f"Missing: {preview}{extra}"
            ),
        )

    rules_result = await db.execute(
        select(PayrollRule).where(
            PayrollRule.school_id == school_id,
            PayrollRule.enabled.is_(True),
            PayrollRule.effective_from <= period_end,
        )
    )
    rules = [
        r for r in rules_result.scalars().all()
        if r.effective_to is None or r.effective_to >= period_start
    ]

    run = PayrollRun(
        school_id=school_id,
        year=payload.year,
        month=payload.month,
        status="DRAFT",
        created_by=current_user.id,
    )
    db.add(run)
    await db.flush()

    for staff in staff_members:
        profile = profiles[staff.id]
        basic = money(profile.basic_salary)
        allowances = json_money(profile.allowances)
        gross = money(basic + sum_map(allowances))
        item = PayrollItem(
            run_id=run.id,
            staff_id=staff.id,
            employee_number=staff.employee_number,
            staff_name=" ".join(
                p for p in (
                    staff.first_name, staff.middle_name, staff.last_name
                ) if p
            ),
            job_title=staff.job_title,
            basic_salary=basic,
            allowances=allowances,
            bonuses=ZERO,
            gross_pay=gross,
            rule_deductions=rule_snapshot_amounts(rules, basic, gross),
            recurring_deductions=json_money(profile.recurring_deductions),
            other_deductions={},
            total_deductions=ZERO,
            net_pay=ZERO,
            payment_status="UNPAID",
        )
        calculate_item(item)
        db.add(item)

    await db.flush()
    await refresh_run_totals(db, run)
    await db.commit()
    await db.refresh(run)
    return {"message": "Draft payroll generated.", "run": run_dict(run)}


@router.get("/runs")
async def list_runs(
    school_id: int = Query(..., gt=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*PAYROLL_ROLES)),
):
    school_id = await resolve_school_id(current_user, school_id, db)
    result = await db.execute(
        select(PayrollRun)
        .where(PayrollRun.school_id == school_id)
        .order_by(PayrollRun.year.desc(), PayrollRun.month.desc())
    )
    return [run_dict(run) for run in result.scalars().all()]


@router.get("/runs/{run_id}")
async def payroll_run_details(
    run_id: int,
    school_id: int = Query(..., gt=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*PAYROLL_ROLES)),
):
    school_id = await resolve_school_id(current_user, school_id, db)
    run = await get_run(db, run_id, school_id)
    result = await db.execute(
        select(PayrollItem)
        .where(PayrollItem.run_id == run.id)
        .order_by(PayrollItem.staff_name)
    )
    return {
        "run": run_dict(run),
        "items": [item_dict(item) for item in result.scalars().all()],
    }


@router.patch("/items/{item_id}")
async def update_payroll_item(
    item_id: int,
    payload: PayrollItemUpdate,
    school_id: int = Query(..., gt=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*PAYROLL_ROLES)),
):
    school_id = await resolve_school_id(current_user, school_id, db)
    item, run = await get_item(db, item_id, school_id)
    if run.status != "DRAFT":
        raise HTTPException(status_code=409, detail="Only draft payroll items can be edited.")

    if "bonuses" in payload.model_fields_set and payload.bonuses is not None:
        item.bonuses = money(payload.bonuses)
    if "other_deductions" in payload.model_fields_set and payload.other_deductions is not None:
        item.other_deductions = json_money(payload.other_deductions)

    calculate_item(item)
    await refresh_run_totals(db, run)
    await db.commit()
    await db.refresh(item)
    return {"message": "Payroll item updated.", "item": item_dict(item)}


@router.post("/runs/{run_id}/approve")
async def approve_payroll(
    run_id: int,
    school_id: int = Query(..., gt=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*PAYROLL_ROLES)),
):
    school_id = await resolve_school_id(current_user, school_id, db)
    run = await get_run(db, run_id, school_id)
    if run.status != "DRAFT":
        raise HTTPException(status_code=409, detail="Only draft payroll can be approved.")

    await refresh_run_totals(db, run)
    run.status = "APPROVED"
    run.approved_by = current_user.id
    run.approved_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(run)
    return {"message": "Payroll approved.", "run": run_dict(run)}


@router.post("/items/{item_id}/mark-paid")
async def mark_payroll_item_paid(
    item_id: int,
    payload: MarkPayrollPaidInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*PAYROLL_ROLES)),
):
    school_id = await resolve_school_id(current_user, payload.school_id, db)
    item, run = await get_item(db, item_id, school_id)
    if run.status != "APPROVED":
        raise HTTPException(status_code=409, detail="Approve payroll before recording payment.")
    if item.payment_status == "PAID":
        raise HTTPException(status_code=409, detail="Payment has already been recorded.")

    item.payment_status = "PAID"
    item.payment_reference = payload.payment_reference.strip()
    item.paid_at = payload.paid_at or datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(item)
    return {
        "message": "Payment record saved. No bank transfer was initiated.",
        "item": item_dict(item),
    }


@router.get("/reports/summary")
async def payroll_report_summary(
    school_id: int = Query(..., gt=0),
    year: int | None = Query(default=None, ge=2000, le=2100),
    month: int | None = Query(default=None, ge=1, le=12),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*PAYROLL_ROLES)),
):
    school_id = await resolve_school_id(current_user, school_id, db)
    if month is not None and year is None:
        raise HTTPException(status_code=422, detail="Provide year when filtering by month.")

    conditions = [PayrollRun.school_id == school_id]
    if year is not None:
        conditions.append(PayrollRun.year == year)
    if month is not None:
        conditions.append(PayrollRun.month == month)

    result = await db.execute(
        select(PayrollRun)
        .where(*conditions)
        .order_by(PayrollRun.year.desc(), PayrollRun.month.desc())
    )
    runs = result.scalars().all()
    run_ids = [r.id for r in runs]
    items = []
    if run_ids:
        item_result = await db.execute(
            select(PayrollItem).where(PayrollItem.run_id.in_(run_ids))
        )
        items = item_result.scalars().all()

    return {
        "school_id": school_id,
        "year": year,
        "month": month,
        "run_count": len(runs),
        "approved_run_count": sum(r.status == "APPROVED" for r in runs),
        "total_gross": float(money(sum((money(r.total_gross) for r in runs), Decimal("0")))),
        "total_deductions": float(money(sum((money(r.total_deductions) for r in runs), Decimal("0")))),
        "total_net": float(money(sum((money(r.total_net) for r in runs), Decimal("0")))),
        "paid_amount": float(money(sum(
            (money(i.net_pay) for i in items if i.payment_status == "PAID"),
            Decimal("0"),
        ))),
        "unpaid_amount": float(money(sum(
            (money(i.net_pay) for i in items if i.payment_status != "PAID"),
            Decimal("0"),
        ))),
        "runs": [run_dict(r) for r in runs],
        "payment_records": [
            {
                "item_id": item.id,
                "run_id": item.run_id,
                "staff_name": item.staff_name,
                "period": next(
                    (f"{r.year}-{r.month:02d}" for r in runs if r.id == item.run_id),
                    None,
                ),
                "net_pay": float(item.net_pay),
                "payment_status": item.payment_status,
                "payment_reference": item.payment_reference,
                "paid_at": item.paid_at.isoformat() if item.paid_at else None,
            }
            for item in items
        ],
    }


@router.get("/items/{item_id}/payslip")
async def download_payslip(
    item_id: int,
    school_id: int = Query(..., gt=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*PAYROLL_ROLES)),
):
    school_id = await resolve_school_id(current_user, school_id, db)
    item, run = await get_item(db, item_id, school_id)

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4, rightMargin=42, leftMargin=42,
        topMargin=42, bottomMargin=42,
    )
    styles = getSampleStyleSheet()
    story = [
        Paragraph("CoreOne — Staff Payslip", styles["Title"]),
        Spacer(1, 10),
        Paragraph(f"Payroll period: {run.year}-{run.month:02d}", styles["Heading2"]),
        Paragraph(f"Staff member: {item.staff_name}", styles["Normal"]),
        Paragraph(f"Employee number: {item.employee_number or 'N/A'}", styles["Normal"]),
        Paragraph(f"Job title: {item.job_title or 'N/A'}", styles["Normal"]),
        Spacer(1, 16),
    ]

    rows = [["Earnings / deductions", "Amount (NGN)"]]
    rows.append(["Basic salary", f"{money(item.basic_salary):,.2f}"])
    for name, amount in (item.allowances or {}).items():
        rows.append([f"Allowance: {name}", f"{money(amount):,.2f}"])
    rows.append(["Bonus", f"{money(item.bonuses):,.2f}"])
    rows.append(["Gross pay", f"{money(item.gross_pay):,.2f}"])

    for entry in (item.rule_deductions or {}).values():
        if isinstance(entry, dict):
            rows.append([
                f"{entry.get('name', 'Payroll rule')} deduction",
                f"{money(entry.get('amount', 0)):,.2f}",
            ])
    for name, amount in (item.recurring_deductions or {}).items():
        rows.append([f"Recurring deduction: {name}", f"{money(amount):,.2f}"])
    for name, amount in (item.other_deductions or {}).items():
        rows.append([f"Other deduction: {name}", f"{money(amount):,.2f}"])

    rows.extend([
        ["Total deductions", f"{money(item.total_deductions):,.2f}"],
        ["NET PAY", f"{money(item.net_pay):,.2f}"],
        ["Payment status", item.payment_status],
    ])
    if item.payment_reference:
        rows.append(["Payment reference", item.payment_reference])

    table = Table(rows, colWidths=[340, 130], repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#16324F")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.grey),
        ("ALIGN", (1, 1), (1, -1), "RIGHT"),
        ("FONTNAME", (0, -2), (-1, -2), "Helvetica-Bold"),
        ("BACKGROUND", (0, -2), (-1, -2), colors.HexColor("#E8F0F7")),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(table)
    story.append(Spacer(1, 14))
    story.append(Paragraph(
        "This payslip reflects the payroll record stored by the school. "
        "A payment status record does not itself confirm a bank transfer.",
        styles["Italic"],
    ))
    doc.build(story)
    buffer.seek(0)

    filename = f"payslip_{item.employee_number or item.staff_id}_{run.year}_{run.month:02d}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
