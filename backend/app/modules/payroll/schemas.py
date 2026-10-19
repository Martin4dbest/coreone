from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


MoneyMap = dict[str, float]


class PayrollProfileInput(BaseModel):
    school_id: int = Field(gt=0)
    staff_id: int = Field(gt=0)
    basic_salary: float = Field(ge=0)
    allowances: MoneyMap = Field(default_factory=dict)
    recurring_deductions: MoneyMap = Field(default_factory=dict)


class PayrollRuleInput(BaseModel):
    school_id: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=120)
    code: str = Field(min_length=1, max_length=60, pattern=r"^[A-Za-z0-9_-]+$")
    category: Literal["TAX", "PENSION", "STATUTORY", "OTHER"] = "STATUTORY"
    calculation: Literal["PERCENTAGE", "FIXED"]
    rate: float = Field(ge=0)
    basis: Literal["GROSS", "BASIC"] = "GROSS"
    effective_from: date
    effective_to: date | None = None
    enabled: bool = True
    statutory: bool = True

    @model_validator(mode="after")
    def validate_dates(self):
        if self.effective_to and self.effective_to < self.effective_from:
            raise ValueError("effective_to cannot be earlier than effective_from")
        if self.calculation == "PERCENTAGE" and self.rate > 100:
            raise ValueError("Percentage rate must be between 0 and 100")
        return self


class GeneratePayrollInput(BaseModel):
    school_id: int = Field(gt=0)
    year: int = Field(ge=2000, le=2100)
    month: int = Field(ge=1, le=12)


class PayrollItemUpdate(BaseModel):
    bonuses: float | None = Field(default=None, ge=0)
    other_deductions: MoneyMap | None = None


class MarkPayrollPaidInput(BaseModel):
    school_id: int = Field(gt=0)
    payment_reference: str = Field(min_length=1, max_length=160)
    paid_at: datetime | None = None


class PayrollProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    school_id: int
    staff_id: int
    basic_salary: float
    allowances: dict
    recurring_deductions: dict
