from pydantic import BaseModel, EmailStr


class SuperAdminCreateRequest(BaseModel):
    email: EmailStr
    password: str


class SuperAdminResponse(BaseModel):
    id: int
    school_id: int
    role_id: int
    email: EmailStr
    is_active: bool
    is_verified: bool

    class Config:
        from_attributes = True
