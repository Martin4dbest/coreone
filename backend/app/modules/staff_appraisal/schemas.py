from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


CATEGORY_WEIGHTS = {
    "subject_performance": 30,
    "cbt_assessment": 20,
    "attendance_punctuality": 15,
    "classroom_professionalism": 20,
    "improvement_development": 15,
}


class StaffAppraisalCreate(BaseModel):
    staff_id: int = Field(gt=0)
    school_id: int | None = Field(default=None, gt=0)
    period_start: date
    period_end: date
    category_ratings: dict[str, int] = Field(default_factory=dict)
    category_evidence: dict[str, str] = Field(default_factory=dict)
    overall_comments: str | None = None
    strengths: str | None = None
    improvement_plan: str | None = None
    development_targets: str | None = None

    @model_validator(mode="after")
    def validate_period_and_ratings(self):
        if self.period_end < self.period_start:
            raise ValueError("Review end date cannot precede start date.")

        unknown = set(self.category_ratings) - set(CATEGORY_WEIGHTS)
        if unknown:
            raise ValueError(f"Unknown categories: {', '.join(sorted(unknown))}")

        for category, rating in self.category_ratings.items():
            if not 1 <= rating <= 5:
                raise ValueError(f"{category} must have a rating from 1 to 5.")

        return self


class StaffAppraisalUpdate(BaseModel):
    category_ratings: dict[str, int] | None = None
    category_evidence: dict[str, str] | None = None
    overall_comments: str | None = None
    strengths: str | None = None
    improvement_plan: str | None = None
    development_targets: str | None = None

    @model_validator(mode="after")
    def validate_ratings(self):
        if self.category_ratings is not None:
            unknown = set(self.category_ratings) - set(CATEGORY_WEIGHTS)
            if unknown:
                raise ValueError(f"Unknown categories: {', '.join(sorted(unknown))}")

            for category, rating in self.category_ratings.items():
                if not 1 <= rating <= 5:
                    raise ValueError(f"{category} must have a rating from 1 to 5.")

        return self


class StaffAppraisalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    school_id: int
    staff_id: int
    teacher_id: int
    period_start: date
    period_end: date
    category_ratings: dict
    category_evidence: dict
    overall_comments: str | None
    strengths: str | None
    improvement_plan: str | None
    development_targets: str | None
    weighted_score: float | None
    status: str
    created_by: int | None
    approved_by: int | None
    approved_at: datetime | None
    created_at: datetime
    updated_at: datetime
