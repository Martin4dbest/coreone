from datetime import datetime

from pydantic import BaseModel


# =====================================================
# EXAMS
# =====================================================

class CBTExamCreateRequest(BaseModel):
    school_id: int
    title: str
    description: str | None = None
    subject_id: int
    class_id: int | None = None
    duration_minutes: int
    total_marks: int
    pass_mark: int
    randomize_questions: bool = True
    randomize_options: bool = True
    allow_resume: bool = True
    show_result_immediately: bool = False
    negative_marking: bool = False
    negative_mark: float = 0.0


class CBTExamResponse(BaseModel):
    id: int
    school_id: int
    title: str
    description: str | None = None

    subject_id: int
    class_id: int | None

    duration_minutes: int
    total_questions: int
    total_marks: int
    pass_mark: int

    randomize_questions: bool
    randomize_options: bool
    allow_resume: bool
    show_result_immediately: bool

    negative_marking: bool
    negative_mark: float

    is_active: bool

    created_at: datetime

    class Config:
        from_attributes = True



# =====================================================
# QUESTIONS
# =====================================================

class CBTQuestionCreateRequest(BaseModel):
    exam_id: int
    question: str

    option_a: str
    option_b: str
    option_c: str
    option_d: str

    option_e: str | None = None

    correct_answer: str

    explanation: str | None = None

    marks: int = 1

    image_url: str | None = None
    audio_url: str | None = None
    video_url: str | None = None


class CBTQuestionResponse(BaseModel):
    id: int
    exam_id: int
    question: str

    option_a: str
    option_b: str
    option_c: str
    option_d: str
    option_e: str | None = None

    marks: int

    image_url: str | None = None
    audio_url: str | None = None
    video_url: str | None = None

    class Config:
        from_attributes = True


# =====================================================
# ATTEMPTS
# =====================================================

class CBTAttemptCreateRequest(BaseModel):
    exam_id: int


class CBTAttemptResponse(BaseModel):
    id: int
    exam_id: int
    student_id: int

    score: int
    total_marks: int
    percentage: float
    passed: bool

    completed: bool

    started_at: datetime | None
    submitted_at: datetime | None

    class Config:
        from_attributes = True


# =====================================================
# ANSWERS
# =====================================================

class CBTAnswerRequest(BaseModel):
    question_id: int
    selected_answer: str
    flagged: bool = False


class CBTAnswerResponse(BaseModel):
    id: int
    attempt_id: int
    question_id: int
    selected_answer: str | None
    is_correct: bool
    marks_awarded: int
    flagged: bool

    class Config:
        from_attributes = True
