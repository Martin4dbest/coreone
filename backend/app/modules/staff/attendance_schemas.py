from datetime import date, datetime

from pydantic import BaseModel, Field


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
    check_in_at: datetime | None = None
    check_in_latitude: float | None = None
    check_in_longitude: float | None = None
    check_in_accuracy: float | None = None
    check_in_distance_meters: float | None = None
    check_in_location_name: str | None = None
    check_in_mocked: bool = False

    class Config:
        from_attributes = True


class StaffClockInRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    accuracy: float = Field(..., gt=0)
    mocked: bool = False


class StaffClockInResponse(BaseModel):
    id: int
    staff_id: int
    school_id: int
    attendance_date: date
    check_in_at: datetime
    status: str
    check_in_latitude: float
    check_in_longitude: float
    check_in_accuracy: float
    check_in_distance_meters: float
    check_in_location_name: str | None = None
    check_in_mocked: bool
    message: str


class StaffClockInStatusResponse(BaseModel):
    checked_in: bool
    attendance: StaffAttendanceResponse | None = None


class StaffAttendanceLocationUpdateRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    location_name: str | None = None
    radius_meters: float = Field(
        default=100.0,
        ge=20.0,
        le=5000.0,
    )


class StaffAttendanceLocationResponse(BaseModel):
    school_id: int
    school_name: str
    latitude: float | None
    longitude: float | None
    radius_meters: float


class StaffAttendanceReportItem(BaseModel):
    id: int
    staff_id: int
    school_id: int
    staff_name: str
    employee_number: str
    attendance_date: date
    status: str
    check_in_at: datetime | None = None
    check_in_latitude: float | None = None
    check_in_longitude: float | None = None
    check_in_accuracy: float | None = None
    check_in_distance_meters: float | None = None

    check_in_location_name: str | None = None

class StaffAttendanceDeleteResponse(BaseModel):
    school_id: int
    start_date: date
    end_date: date
    deleted_count: int
    message: str
