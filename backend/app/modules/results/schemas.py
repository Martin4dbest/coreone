from pydantic import BaseModel


class ResultCreateRequest(BaseModel):
    school_id: int
    student_id: int
    class_id: int
    subject_id: int
    term_id: int
    academic_session_id: int
    ca_score: float = 0
    exam_score: float = 0
    grade: str | None = None
    remark: str | None = None


class ResultResponse(BaseModel):
    id: int
    school_id: int
    student_id: int
    class_id: int
    subject_id: int
    term_id: int
    academic_session_id: int
    ca_score: float
    exam_score: float
    total_score: float
    grade: str | None = None
    remark: str | None = None
    is_active: bool

    class Config:
        from_attributes = True
