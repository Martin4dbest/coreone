from decimal import Decimal

from pydantic import BaseModel, Field


class FeeStructureItemCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: str | None = None
    amount: Decimal = Field(gt=0)


class FeeStructureCreateRequest(BaseModel):
    school_id: int
    academic_session_id: int
    term_id: int
    classroom_id: int | None = None
    name: str = Field(min_length=1, max_length=150)
    description: str | None = None
    items: list[FeeStructureItemCreate] = Field(min_length=1)


class FeeStructureItemResponse(BaseModel):
    id: int
    name: str
    description: str | None
    amount: Decimal

    class Config:
        from_attributes = True


class FeeStructureResponse(BaseModel):
    id: int
    school_id: int
    academic_session_id: int
    term_id: int
    classroom_id: int | None
    name: str
    description: str | None
    is_active: bool
    total_amount: Decimal
    items: list[FeeStructureItemResponse]

    class Config:
        from_attributes = True


class StudentFeeCreateRequest(BaseModel):
    school_id: int
    student_id: int
    fee_structure_id: int
    adjustment_amount: Decimal = Decimal("0.00")
    adjustment_reason: str | None = None


class StudentFeeResponse(BaseModel):
    id: int
    school_id: int
    student_id: int
    fee_structure_id: int
    invoice_number: str
    amount_due: Decimal
    amount_paid: Decimal
    balance: Decimal
    adjustment_amount: Decimal
    adjustment_reason: str | None
    status: str

    class Config:
        from_attributes = True


class BulkStudentFeeCreateRequest(BaseModel):
    school_id: int
    fee_structure_id: int
    classroom_id: int | None = None
    student_ids: list[int] = Field(default_factory=list)
    adjustment_amount: Decimal = Decimal("0.00")
    adjustment_reason: str | None = None


class BulkStudentFeeResult(BaseModel):
    created: list[StudentFeeResponse]
    skipped_student_ids: list[int]
    created_count: int
    skipped_count: int
