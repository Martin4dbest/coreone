from pydantic import BaseModel, EmailStr


class MobileLoginRequest(BaseModel):
    school_code: str
    email: EmailStr
    password: str


class MobileUserResponse(BaseModel):
    id: int
    email: str
    role: str
    school_id: int
    must_change_password: bool


class MobileTenantResponse(BaseModel):
    id: int
    name: str
    school_code: str


class MobileLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: MobileUserResponse
    tenant: MobileTenantResponse
