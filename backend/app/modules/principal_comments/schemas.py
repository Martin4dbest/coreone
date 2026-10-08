from pydantic import BaseModel, Field


class PrincipalCommentBankCreateRequest(BaseModel):
    school_id: int
    title: str = Field(..., min_length=1, max_length=120)
    min_score: float = Field(..., ge=0, le=100)
    max_score: float = Field(..., ge=0, le=100)
    comment: str = Field(..., min_length=1)


class PrincipalCommentBankUpdateRequest(BaseModel):
    school_id: int
    title: str = Field(..., min_length=1, max_length=120)
    min_score: float = Field(..., ge=0, le=100)
    max_score: float = Field(..., ge=0, le=100)
    comment: str = Field(..., min_length=1)
    is_active: bool = True


class PrincipalCommentBankApplyRequest(BaseModel):
    school_id: int
    class_id: int
    term_id: int
    academic_session_id: int
    bank_id: int
    student_ids: list[int] = Field(default_factory=list)


class PrincipalCommentBankResponse(BaseModel):
    id: int
    school_id: int
    title: str
    min_score: float
    max_score: float
    comment: str
    is_active: bool

    class Config:
        from_attributes = True


class PrincipalCommentPreviewItem(BaseModel):
    student_id: int
    student_name: str
    admission_number: str | None = None
    average: float
    subjects_count: int
    matches_range: bool
    has_manual_principal_comment: bool
    existing_comment: str | None = None


class PrincipalCommentPreviewResponse(BaseModel):
    bank_id: int
    min_score: float
    max_score: float
    comment: str
    students: list[PrincipalCommentPreviewItem]
