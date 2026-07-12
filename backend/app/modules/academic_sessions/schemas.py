from pydantic import BaseModel


class AcademicSessionCreateRequest(BaseModel):
    school_id: int
    name: str
    is_current: bool = False


class AcademicSessionResponse(BaseModel):
    id: int
    school_id: int
    name: str
    is_current: bool

    class Config:
        from_attributes = True
