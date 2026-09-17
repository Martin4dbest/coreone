from datetime import date

from pydantic import BaseModel


class StaffAttendanceCreateRequest(BaseModel):
    staff_id: int
    attendance_date: date
    status: str
    remarks: str | None = None


class StaffAttendanceUpdateRequest(BaseModel):
    status: str
    remarks: str | None = None


class StaffAttendanceResponse(BaseModel):
    id: int
    staff_id: int
    school_id: int
    attendance_date: date
    status: str
    remarks: str | None = None

    class Config:
        from_attributes = True
