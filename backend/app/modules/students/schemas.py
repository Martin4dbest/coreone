from datetime import date

from pydantic import BaseModel, EmailStr


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


class StudentImportResponse(BaseModel):
    success: bool
    created: int
    errors: list[str] = []


class StudentResponse(BaseModel):
    id: int

    user_id: int

    classroom_id: int | None = None

    admission_number: str

    first_name: str
    last_name: str

    middle_name: str | None = None

    gender: str

    date_of_birth: date

    passport: str | None = None

    class Config:
        from_attributes = True