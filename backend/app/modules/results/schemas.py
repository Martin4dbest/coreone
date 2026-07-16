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
    is_active: bool

    class Config:
        from_attributes = True


class ResultUpdateRequest(BaseModel):
    student_id: int
    class_id: int
    subject_id: int
    term_id: int
    academic_session_id: int
    ca_score: float = 0
    exam_score: float = 0
    grade: str | None = None
    remark: str | None = None
