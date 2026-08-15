from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreateRequest(BaseModel):
    email: EmailStr
    password: str
    role_id: int
    school_id: int


class UserResponse(BaseModel):
    id: int
    school_id: int
    role_id: int
    email: EmailStr
    is_active: bool
    is_verified: bool

    class Config:
        from_attributes = True


class UserStatusUpdate(BaseModel):
    is_active: bool