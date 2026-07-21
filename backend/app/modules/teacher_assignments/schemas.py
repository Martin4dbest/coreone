from datetime import datetime

from pydantic import BaseModel


class TeacherSubjectCreate(BaseModel):
    school_id: int
    teacher_id: int
    classroom_id: int
    subject_id: int
    academic_session_id: int


class TeacherSubjectResponse(BaseModel):
    id: int
    school_id: int

    teacher_id: int
    classroom_id: int
    subject_id: int
    academic_session_id: int

    assigned_by: int
    assigned_at: datetime

    is_active: bool

    class Config:
        from_attributes = True


class TeacherSubjectUpdate(BaseModel):
    classroom_id: int
    subject_id: int
    academic_session_id: int
