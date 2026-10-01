from datetime import time

from pydantic import BaseModel, ConfigDict, Field


DAYS = (
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
)


class TimetableCreateRequest(BaseModel):
    school_id: int
    academic_session_id: int
    term_id: int
    classroom_id: int
    subject_id: int
    teacher_id: int
    day_of_week: str
    start_time: time
    end_time: time

    model_config = ConfigDict(extra="forbid")


class TimetableUpdateRequest(BaseModel):
    academic_session_id: int
    term_id: int
    classroom_id: int
    subject_id: int
    teacher_id: int
    day_of_week: str
    start_time: time
    end_time: time

    model_config = ConfigDict(extra="forbid")


class TimetableResponse(BaseModel):
    id: int
    school_id: int
    academic_session_id: int
    academic_session_name: str
    term_id: int
    term_name: str
    classroom_id: int
    classroom_name: str
    subject_id: int
    subject_name: str
    teacher_id: int
    teacher_name: str
    day_of_week: str
    start_time: time
    end_time: time
    is_active: bool

    class Config:
        from_attributes = True


class TimetableListResponse(TimetableResponse):
    pass
