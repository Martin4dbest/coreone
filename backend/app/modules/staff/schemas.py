from pydantic import BaseModel, ConfigDict, EmailStr


class StaffCreateRequest(BaseModel):
    email: EmailStr
    password: str
    school_id: int

    employee_number: str
    first_name: str
    last_name: str


class StaffUpdateRequest(BaseModel):
    email: EmailStr | None = None
    employee_number: str | None = None
    first_name: str | None = None
    last_name: str | None = None


class StaffResponse(BaseModel):
    id: int
    user_id: int

    employee_number: str
    first_name: str
    last_name: str

    email: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class StaffStatusResponse(BaseModel):
    id: int
    user_id: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
