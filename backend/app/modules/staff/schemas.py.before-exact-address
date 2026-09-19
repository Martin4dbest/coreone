from datetime import date

from pydantic import BaseModel, ConfigDict, EmailStr


class StaffCreateRequest(BaseModel):
    email: EmailStr
    password: str
    school_id: int

    employee_number: str
    first_name: str
    middle_name: str | None = None
    last_name: str

    gender: str | None = None
    date_of_birth: date | None = None
    phone: str | None = None
    address: str | None = None

    job_title: str | None = None
    department: str | None = None
    employment_type: str | None = None
    date_employed: date | None = None

    qualification: str | None = None

    emergency_contact_name: str | None = None
    emergency_contact_relationship: str | None = None
    emergency_contact_phone: str | None = None

    profile_photo: str | None = None
    notes: str | None = None


class StaffUpdateRequest(BaseModel):
    email: EmailStr | None = None
    employee_number: str | None = None

    first_name: str | None = None
    middle_name: str | None = None
    last_name: str | None = None

    gender: str | None = None
    date_of_birth: date | None = None
    phone: str | None = None
    address: str | None = None

    job_title: str | None = None
    department: str | None = None
    employment_type: str | None = None
    date_employed: date | None = None

    qualification: str | None = None

    emergency_contact_name: str | None = None
    emergency_contact_relationship: str | None = None
    emergency_contact_phone: str | None = None

    profile_photo: str | None = None
    notes: str | None = None


class StaffResponse(BaseModel):
    id: int
    user_id: int

    employee_number: str

    first_name: str
    middle_name: str | None = None
    last_name: str

    gender: str | None = None
    date_of_birth: date | None = None
    phone: str | None = None
    address: str | None = None

    job_title: str | None = None
    department: str | None = None
    employment_type: str | None = None
    date_employed: date | None = None

    qualification: str | None = None

    emergency_contact_name: str | None = None
    emergency_contact_relationship: str | None = None
    emergency_contact_phone: str | None = None

    profile_photo: str | None = None
    notes: str | None = None

    email: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class StaffStatusResponse(BaseModel):
    id: int
    user_id: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
