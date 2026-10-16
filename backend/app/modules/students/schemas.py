from datetime import date

from pydantic import BaseModel, ConfigDict, EmailStr


class StudentCreateRequest(BaseModel):
    email: EmailStr
    password: str

    classroom_id: int | None = None

    admission_number: str

    first_name: str
    last_name: str

    middle_name: str | None = None

    gender: str

    date_of_birth: date

    passport: str | None = None

    lga: str | None = None
    state: str | None = None
    country: str | None = None
    address: str | None = None
    parent_guardian_name: str | None = None
    parent_guardian_phone: str | None = None


class StudentImportResponse(BaseModel):
    success: bool
    created: int
    errors: list[str] = []


class PartnerSchoolSummary(BaseModel):
    id: int
    name: str


class StudentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int

    user_id: int

    school_id: int

    school_name: str | None = None

    classroom_id: int | None = None

    class_name: str | None = None

    admission_number: str

    first_name: str
    last_name: str

    middle_name: str | None = None

    gender: str

    date_of_birth: date

    passport: str | None = None

    partner_schools: list[PartnerSchoolSummary] = []


class StudentUpdateRequest(BaseModel):
    classroom_id: int | None = None
    first_name: str | None = None
    middle_name: str | None = None
    last_name: str | None = None
    gender: str | None = None
    date_of_birth: date | None = None
    lga: str | None = None
    state: str | None = None
    country: str | None = None
    address: str | None = None
    parent_guardian_name: str | None = None
    parent_guardian_phone: str | None = None
