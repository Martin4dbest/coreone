from pydantic import BaseModel, EmailStr


class SchoolCreateRequest(BaseModel):
    name: str
    school_code: str
    email: EmailStr
    phone: str
    address: str
    city: str
    state: str
    country: str = "Nigeria"


class SchoolResponse(BaseModel):
    id: int
    name: str
    school_code: str

    email: EmailStr
    phone: str
    address: str
    city: str
    state: str
    country: str

    staff_attendance_latitude: float | None = None
    staff_attendance_longitude: float | None = None
    staff_attendance_radius_meters: float = 100.0

    is_active: bool

    logo_url: str | None = None
    motto: str | None = None

    primary_color: str | None = None
    secondary_color: str | None = None

    login_background_url: str | None = None

    class Config:
        from_attributes = True