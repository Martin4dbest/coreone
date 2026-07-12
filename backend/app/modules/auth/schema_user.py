from pydantic import BaseModel, EmailStr


class RoleResponse(BaseModel):
    name: str

    class Config:
        from_attributes = True


class CurrentUserResponse(BaseModel):
    id: int
    school_id: int | None
    role_id: int
    email: EmailStr
    is_active: bool
    is_verified: bool
    role: RoleResponse

    class Config:
        from_attributes = True
