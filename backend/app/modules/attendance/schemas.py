from datetime import date

from pydantic import BaseModel


class AttendanceCreateRequest(BaseModel):
    school_id: int
    student_id: int
    classroom_id: int
    attendance_date: date
    status: str
    remarks: str | None = None


class AttendanceResponse(BaseModel):
    id: int
    school_id: int
    student_id: int
    classroom_id: int
    attendance_date: date
    status: str
    remarks: str | None = None

    class Config:
        from_attributes = True
