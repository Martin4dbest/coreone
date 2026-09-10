from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.fees.schemas import (
    BulkStudentFeeCreateRequest,
    BulkStudentFeeResult,
    FeeStructureCreateRequest,
    FeeStructureResponse,
    StudentFeeCreateRequest,
    StudentFeeResponse,
)
from app.modules.fees.service import FeeService


router = APIRouter(
    prefix="/fees",
    tags=["School Fees"],
)


@router.post(
    "/structures",
    response_model=FeeStructureResponse,
)
async def create_fee_structure(
    payload: FeeStructureCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fee_structure = await FeeService(db).create_fee_structure(
        payload,
        current_user,
    )

    total_amount = sum(
        (Decimal(item.amount) for item in fee_structure.items),
        Decimal("0.00"),
    )

    return {
        "id": fee_structure.id,
        "school_id": fee_structure.school_id,
        "academic_session_id": fee_structure.academic_session_id,
        "term_id": fee_structure.term_id,
        "classroom_id": fee_structure.classroom_id,
        "name": fee_structure.name,
        "description": fee_structure.description,
        "is_active": fee_structure.is_active,
        "total_amount": total_amount,
        "items": fee_structure.items,
    }


@router.get(
    "/structures",
    response_model=list[FeeStructureResponse],
)
async def get_fee_structures(
    school_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fee_structures = await FeeService(db).get_fee_structures(
        current_user,
        school_id,
    )

    return [
        {
            "id": fee_structure.id,
            "school_id": fee_structure.school_id,
            "academic_session_id": fee_structure.academic_session_id,
            "term_id": fee_structure.term_id,
            "classroom_id": fee_structure.classroom_id,
            "name": fee_structure.name,
            "description": fee_structure.description,
            "is_active": fee_structure.is_active,
            "total_amount": sum(
                (Decimal(item.amount) for item in fee_structure.items),
                Decimal("0.00"),
            ),
            "items": fee_structure.items,
        }
        for fee_structure in fee_structures
    ]


@router.get(
    "/structures/{fee_structure_id}",
    response_model=FeeStructureResponse,
)
async def get_fee_structure(
    fee_structure_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fee_structure = await FeeService(db).get_fee_structure(
        fee_structure_id,
        current_user,
    )

    return {
        "id": fee_structure.id,
        "school_id": fee_structure.school_id,
        "academic_session_id": fee_structure.academic_session_id,
        "term_id": fee_structure.term_id,
        "classroom_id": fee_structure.classroom_id,
        "name": fee_structure.name,
        "description": fee_structure.description,
        "is_active": fee_structure.is_active,
        "total_amount": sum(
            (Decimal(item.amount) for item in fee_structure.items),
            Decimal("0.00"),
        ),
        "items": fee_structure.items,
    }


@router.post(
    "/student-fees",
    response_model=StudentFeeResponse,
)
async def create_student_fee(
    payload: StudentFeeCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    student_fee = await FeeService(db).create_student_fee(
        payload,
        current_user,
    )

    balance = (
        Decimal(student_fee.amount_due)
        - Decimal(student_fee.amount_paid)
    )

    return {
        "id": student_fee.id,
        "school_id": student_fee.school_id,
        "student_id": student_fee.student_id,
        "fee_structure_id": student_fee.fee_structure_id,
        "invoice_number": student_fee.invoice_number,
        "amount_due": student_fee.amount_due,
        "amount_paid": student_fee.amount_paid,
        "balance": max(balance, Decimal("0.00")),
        "adjustment_amount": student_fee.adjustment_amount,
        "adjustment_reason": student_fee.adjustment_reason,
        "status": student_fee.status,
    }


@router.post(
    "/student-fees/bulk",
    response_model=BulkStudentFeeResult,
)
async def create_bulk_student_fees(
    payload: BulkStudentFeeCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await FeeService(db).create_bulk_student_fees(
        payload,
        current_user,
    )

    created = [
        {
            "id": student_fee.id,
            "school_id": student_fee.school_id,
            "student_id": student_fee.student_id,
            "fee_structure_id": student_fee.fee_structure_id,
            "invoice_number": student_fee.invoice_number,
            "amount_due": student_fee.amount_due,
            "amount_paid": student_fee.amount_paid,
            "balance": max(
                Decimal(student_fee.amount_due)
                - Decimal(student_fee.amount_paid),
                Decimal("0.00"),
            ),
            "adjustment_amount": student_fee.adjustment_amount,
            "adjustment_reason": student_fee.adjustment_reason,
            "status": student_fee.status,
        }
        for student_fee in result["created"]
    ]

    return {
        "created": created,
        "skipped_student_ids": result["skipped_student_ids"],
        "created_count": result["created_count"],
        "skipped_count": result["skipped_count"],
    }


@router.get(
    "/student-fees",
    response_model=list[StudentFeeResponse],
)
async def get_student_fees(
    student_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    student_fees = await FeeService(db).get_student_fees(
        current_user,
        student_id,
    )

    return [
        {
            "id": student_fee.id,
            "school_id": student_fee.school_id,
            "student_id": student_fee.student_id,
            "fee_structure_id": student_fee.fee_structure_id,
            "invoice_number": student_fee.invoice_number,
            "amount_due": student_fee.amount_due,
            "amount_paid": student_fee.amount_paid,
            "balance": max(
                Decimal(student_fee.amount_due)
                - Decimal(student_fee.amount_paid),
                Decimal("0.00"),
            ),
            "adjustment_amount": student_fee.adjustment_amount,
            "adjustment_reason": student_fee.adjustment_reason,
            "status": student_fee.status,
        }
        for student_fee in student_fees
    ]
