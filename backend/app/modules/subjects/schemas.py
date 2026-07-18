from pydantic import BaseModel


class SubjectCreateRequest(BaseModel):
    school_id: int
    department_id: int | None = None
    name: str
    code: str | None = None


class SubjectResponse(BaseModel):
    id: int
    school_id: int
    department_id: int | None = None
    name: str
    code: str | None = None
    is_active: bool

    class Config:
        from_attributes = True


class SubjectStatusUpdate(BaseModel):
    is_active: bool
