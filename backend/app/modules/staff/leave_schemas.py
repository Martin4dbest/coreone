from datetime import date

from pydantic import BaseModel


class StaffLeaveCreateRequest(BaseModel):
    leave_type: str
    start_date: date
    end_date: date
    reason: str | None = None


class StaffLeaveReviewRequest(BaseModel):
    status: str
    admin_remarks: str | None = None


class StaffLeaveResponse(BaseModel):
    id: int
    staff_id: int
    school_id: int
    leave_type: str
    start_date: date
    end_date: date
    reason: str | None
    status: str
    admin_remarks: str | None

    class Config:
        from_attributes = True
