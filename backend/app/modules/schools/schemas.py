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

    logo_url: str | None = None
    motto: str | None = None
    primary_color: str | None = None
    secondary_color: str | None = None

    class Config:
        from_attributes = True
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
