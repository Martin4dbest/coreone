from pydantic import BaseModel, EmailStr


class CurrentUserResponse(BaseModel):
    id: int
    school_id: int
    role_id: int
    email: EmailStr
    is_active: bool
    is_verified: bool

    class Config:
        from_attributes = True
