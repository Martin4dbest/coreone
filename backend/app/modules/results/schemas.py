from pydantic import BaseModel, ConfigDict, Field


class ResultCreateRequest(BaseModel):
    school_id: int
    student_id: int
    class_id: int
    subject_id: int
    term_id: int
    academic_session_id: int
    ca_score: float = Field(default=0, ge=0, le=40)
    exam_score: float = Field(default=0, ge=0, le=60)
    teacher_comment: str | None = None
    principal_comment: str | None = None


class ResultUpdateRequest(BaseModel):
    student_id: int
    class_id: int
    subject_id: int
    term_id: int
    academic_session_id: int
    ca_score: float = Field(default=0, ge=0, le=40)
    exam_score: float = Field(default=0, ge=0, le=60)
    teacher_comment: str | None = None
    principal_comment: str | None = None


class BulkResultItem(BaseModel):
    student_id: int
    ca_score: float = Field(default=0, ge=0, le=40)
    exam_score: float = Field(default=0, ge=0, le=60)


class BulkResultEntryRequest(BaseModel):
    school_id: int
    class_id: int
    subject_id: int
    term_id: int
    academic_session_id: int
    results: list[BulkResultItem]


class ResultResponse(BaseModel):
    id: int
    school_id: int

    student_id: int
    student_name: str
    admission_number: str

    class_id: int
    class_name: str

    subject_id: int
    subject_name: str

    term_id: int
    term_name: str

    academic_session_id: int
    session_name: str

    ca_score: float
    exam_score: float
    total_score: float

    grade: str | None = None
    remark: str | None = None

    status: str = "PUBLISHED"
    teacher_comment: str | None = None
    principal_comment: str | None = None

    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class ResultCommentRequest(BaseModel):
    comment: str