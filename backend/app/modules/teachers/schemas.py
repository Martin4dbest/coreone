from pydantic import BaseModel, EmailStr


class TeacherCreateRequest(BaseModel):
    email: EmailStr
    password: str
    school_id: int

    employee_number: str
    first_name: str
    last_name: str


class TeacherResponse(BaseModel):
    id: int
    user_id: int

    employee_number: str
    first_name: str
    last_name: str

    class Config:
        from_attributes = True
