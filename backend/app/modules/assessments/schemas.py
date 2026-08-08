from datetime import datetime

from pydantic import BaseModel


class AssessmentCreateRequest(BaseModel):
    school_id: int
    title: str
    description: str | None = None
    assessment_type: str
    class_id: int
    teacher_id: int
    due_date: datetime | None = None


class AssessmentResponse(BaseModel):
    id: int
    school_id: int
    title: str
    description: str | None = None
    assessment_type: str
    class_id: int
    teacher_id: int
    due_date: datetime | None = None
    is_published: bool
    is_active: bool

    class Config:
        from_attributes = True