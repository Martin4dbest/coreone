from pydantic import BaseModel, EmailStr
from typing import Optional


class SchoolCreateRequest(BaseModel):
    name: str
    school_code: str
    email: EmailStr
    phone: str
    address: str
    city: str
    state: str
    country: str = "Nigeria"


class SchoolResponse(BaseModel):
    id: int
    name: str
    school_code: str
    email: EmailStr
    phone: str
    address: str
    city: str
    state: str
    country: str
    is_active: bool

    class Config:
        from_attributes = True
