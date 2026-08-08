from pydantic import BaseModel, EmailStr


class ParentCreateRequest(BaseModel):
    email: EmailStr
    password: str
    school_id: int

    first_name: str
    last_name: str
    phone: str


class ParentUpdateRequest(BaseModel):
    first_name: str
    last_name: str
    phone: str


class ParentResponse(BaseModel):
    id: int
    user_id: int

    first_name: str
    last_name: str
    phone: str

    class Config:
        from_attributes = True