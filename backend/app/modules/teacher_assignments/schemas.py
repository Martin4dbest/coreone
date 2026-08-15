from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TeacherSubjectCreate(BaseModel):
    school_id: int
    teacher_id: int
    classroom_id: int
    subject_id: int
    academic_session_id: int


class TeacherSubjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    school_id: int

    teacher_id: int
    classroom_id: int
    subject_id: int
    academic_session_id: int

    assigned_by: int
    assigned_at: datetime

    # IMPORTANT:
    # The frontend uses this to determine whether an assignment
    # should be displayed.
    is_active: bool


class TeacherSubjectUpdate(BaseModel):
    classroom_id: int
    subject_id: int
    academic_session_id: int
