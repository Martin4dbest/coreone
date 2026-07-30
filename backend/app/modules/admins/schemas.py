from pydantic import BaseModel, EmailStr


class SchoolAdminCreateRequest(BaseModel):
    email: EmailStr
    password: str
    school_id: int


class SchoolAdminResponse(BaseModel):
    id: int
    school_id: int
    school_name: str | None = None
    school_code: str | None = None
    role_id: int
    email: EmailStr
    is_active: bool
    is_verified: bool

    class Config:
        from_attributes = True
