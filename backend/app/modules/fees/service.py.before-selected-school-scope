from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.fee_structure import FeeStructure, FeeStructureItem
from app.models.student_fee import StudentFee
from app.modules.fees.repository import FeeRepository
from app.modules.fees.schemas import (
    BulkStudentFeeCreateRequest,
    FeeStructureCreateRequest,
    StudentFeeCreateRequest,
)


MONEY = Decimal("0.01")


class FeeService:

    def __init__(self, db: AsyncSession):
        self.repository = FeeRepository(db)

    @staticmethod
    def _money(value: Decimal) -> Decimal:
        return Decimal(value).quantize(
            MONEY,
            rounding=ROUND_HALF_UP,
        )

    @staticmethod
    def _school_scope(
        current_user,
        requested_school_id: int,
    ):
        role = current_user.role.name

        if role != "SUPER_ADMIN":
            if requested_school_id != current_user.school_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You cannot access another school",
                )

        return (
            None
            if role == "SUPER_ADMIN"
            else current_user.school_id
        )

    @staticmethod
    def _ensure_fee_management_role(current_user):
        allowed_roles = {
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
            "ACCOUNTANT",
        }

        if current_user.role.name not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to manage school fees",
            )

    async def create_fee_structure(
        self,
        payload: FeeStructureCreateRequest,
        current_user,
    ):
        self._ensure_fee_management_role(current_user)

        self._school_scope(
            current_user,
            payload.school_id,
        )

        session = await self.repository.get_academic_session(
            payload.academic_session_id,
            payload.school_id,
        )

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Academic session not found in this school",
            )

        term = await self.repository.get_term(
            payload.term_id,
            payload.school_id,
            payload.academic_session_id,
        )

        if not term:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Term not found for this school and academic session",
            )

        if payload.classroom_id is not None:
            classroom = await self.repository.get_classroom(
                payload.classroom_id,
                payload.school_id,
            )

            if not classroom:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Classroom not found in this school",
                )

            if not classroom.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This classroom is inactive",
                )

        fee_structure = FeeStructure(
            school_id=payload.school_id,
            academic_session_id=payload.academic_session_id,
            term_id=payload.term_id,
            classroom_id=payload.classroom_id,
            name=payload.name.strip(),
            description=payload.description,
        )

        total = Decimal("0.00")

        for item in payload.items:
            amount = self._money(
                Decimal(item.amount)
            )

            if amount <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Fee item amounts must be greater than zero",
                )

            fee_structure.items.append(
                FeeStructureItem(
                    name=item.name.strip(),
                    description=item.description,
                    amount=amount,
                )
            )

            total += amount

        total = self._money(total)

        if total <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Fee structure total must be greater than zero",
            )

        try:
            return await self.repository.create_fee_structure(
                fee_structure
            )
        except Exception as exc:
            await self.repository.db.rollback()

            if "uq_fee_structures_scope_name" in str(exc):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A fee structure with this name already exists for this school, session, term and class",
                ) from exc

            raise

    async def get_fee_structures(
        self,
        current_user,
        school_id: int | None = None,
    ):
        self._ensure_fee_management_role(current_user)

        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

        return await self.repository.get_fee_structures(
            school_id
        )

    async def get_fee_structure(
        self,
        fee_structure_id: int,
        current_user,
    ):
        self._ensure_fee_management_role(current_user)

        school_id = (
            None
            if current_user.role.name == "SUPER_ADMIN"
            else current_user.school_id
        )

        fee_structure = await self.repository.get_fee_structure(
            fee_structure_id,
            school_id,
        )

        if not fee_structure:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Fee structure not found",
            )

        return fee_structure

    async def create_student_fee(
        self,
        payload: StudentFeeCreateRequest,
        current_user,
    ):
        self._ensure_fee_management_role(current_user)

        self._school_scope(
            current_user,
            payload.school_id,
        )

        fee_structure = await self.repository.get_fee_structure(
            payload.fee_structure_id,
            payload.school_id,
        )

        if not fee_structure:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Fee structure not found",
            )

        if not fee_structure.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This fee structure is inactive",
            )

        student = await self.repository.get_student(
            payload.student_id,
            payload.school_id,
        )

        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found in this school",
            )

        existing = await self.repository.get_existing_student_fee(
            payload.school_id,
            payload.student_id,
            payload.fee_structure_id,
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Student already has invoice {existing.invoice_number} for this fee structure",
            )

        total = sum(
            (
                self._money(Decimal(item.amount))
                for item in fee_structure.items
            ),
            Decimal("0.00"),
        )

        adjustment = self._money(
            Decimal(payload.adjustment_amount)
        )

        total = self._money(total + adjustment)

        if total < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Fee amount cannot be negative",
            )

        invoice_number = (
            f"INV-{payload.school_id}-"
            f"{payload.student_id}-"
            f"{fee_structure.id}"
        )

        student_fee = StudentFee(
            school_id=payload.school_id,
            student_id=payload.student_id,
            fee_structure_id=payload.fee_structure_id,
            invoice_number=invoice_number,
            amount_due=total,
            amount_paid=Decimal("0.00"),
            adjustment_amount=adjustment,
            adjustment_reason=payload.adjustment_reason,
            status="UNPAID",
        )

        try:
            return await self.repository.create_student_fee(
                student_fee
            )
        except Exception as exc:
            await self.repository.db.rollback()

            if "uq_student_fees_student_structure" in str(exc):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This student already has an invoice for this fee structure",
                ) from exc

            if "student_fees_invoice_number_key" in str(exc):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This invoice number already exists",
                ) from exc

            raise

    async def create_bulk_student_fees(
        self,
        payload: BulkStudentFeeCreateRequest,
        current_user,
    ):
        self._ensure_fee_management_role(current_user)

        self._school_scope(
            current_user,
            payload.school_id,
        )

        if payload.classroom_id is None and not payload.student_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Provide either classroom_id or student_ids",
            )

        if payload.classroom_id is not None and payload.student_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Provide classroom_id or student_ids, not both",
            )

        fee_structure = await self.repository.get_fee_structure(
            payload.fee_structure_id,
            payload.school_id,
        )

        if not fee_structure:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Fee structure not found",
            )

        if not fee_structure.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This fee structure is inactive",
            )

        if payload.classroom_id is not None:
            classroom = await self.repository.get_classroom(
                payload.classroom_id,
                payload.school_id,
            )

            if not classroom:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Classroom not found in this school",
                )

            if not classroom.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This classroom is inactive",
                )

            students = await self.repository.get_students_by_classroom(
                payload.classroom_id,
                payload.school_id,
            )
        else:
            requested_ids = list(dict.fromkeys(payload.student_ids))

            students = await self.repository.get_students_by_ids(
                requested_ids,
                payload.school_id,
            )

            found_ids = {student.id for student in students}
            missing_ids = [
                student_id
                for student_id in requested_ids
                if student_id not in found_ids
            ]

            if missing_ids:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=(
                        "One or more selected students were not found "
                        "in this school"
                    ),
                )

        if not students:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active students were found for invoice assignment",
            )

        existing_fees = (
            await self.repository.get_existing_student_fees_for_structure(
                payload.school_id,
                [student.id for student in students],
                payload.fee_structure_id,
            )
        )

        existing_student_ids = {
            student_fee.student_id
            for student_fee in existing_fees
        }

        adjustment = self._money(
            Decimal(payload.adjustment_amount)
        )

        base_total = sum(
            (
                self._money(Decimal(item.amount))
                for item in fee_structure.items
            ),
            Decimal("0.00"),
        )

        total = self._money(base_total + adjustment)

        if total < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Fee amount cannot be negative",
            )

        new_fees = []
        skipped_student_ids = []

        for student in students:
            if student.id in existing_student_ids:
                skipped_student_ids.append(student.id)
                continue

            invoice_number = (
                f"INV-{payload.school_id}-"
                f"{student.id}-"
                f"{fee_structure.id}"
            )

            new_fees.append(
                StudentFee(
                    school_id=payload.school_id,
                    student_id=student.id,
                    fee_structure_id=payload.fee_structure_id,
                    invoice_number=invoice_number,
                    amount_due=total,
                    amount_paid=Decimal("0.00"),
                    adjustment_amount=adjustment,
                    adjustment_reason=payload.adjustment_reason,
                    status="UNPAID",
                )
            )

        try:
            created = await self.repository.create_student_fees(
                new_fees
            )
        except Exception:
            await self.repository.db.rollback()
            raise

        return {
            "created": created,
            "skipped_student_ids": skipped_student_ids,
            "created_count": len(created),
            "skipped_count": len(skipped_student_ids),
        }

    async def get_student_fees(
        self,
        current_user,
        student_id: int | None = None,
    ):
        self._ensure_fee_management_role(current_user)

        school_id = (
            None
            if current_user.role.name == "SUPER_ADMIN"
            else current_user.school_id
        )

        if student_id is not None:
            student = await self.repository.get_student(
                student_id,
                school_id,
            )

            if not student:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Student not found in this school",
                )

        return await self.repository.get_student_fees(
            school_id,
            student_id,
        )
