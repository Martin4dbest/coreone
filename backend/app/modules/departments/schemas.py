from pydantic import BaseModel


class DepartmentCreateRequest(BaseModel):
    school_id: int
    name: str
    description: str | None = None


class DepartmentResponse(BaseModel):
    id: int
    school_id: int
    name: str
    description: str | None = None
    is_active: bool

    class Config:
        from_attributes = True