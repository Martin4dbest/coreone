from datetime import date

from pydantic import BaseModel, EmailStr


class StudentCreateRequest(BaseModel):

    email: EmailStr
    password: str

    school_id: int

    classroom_id: int | None = None

    admission_number: str

    first_name: str
    last_name: str

    middle_name: str | None = None

    gender: str

    date_of_birth: date

    passport: str | None = None



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
