from pydantic import BaseModel


class TermCreateRequest(BaseModel):
    school_id: int
    academic_session_id: int
    name: str
    is_current: bool = False


class TermResponse(BaseModel):
    id: int
    school_id: int
    academic_session_id: int
    name: str
    is_current: bool

    class Config:
        from_attributes = True