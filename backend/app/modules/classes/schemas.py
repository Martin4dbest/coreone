from pydantic import BaseModel


class ClassCreateRequest(BaseModel):
    school_id: int
    level_id: int
    name: str


class ClassResponse(BaseModel):
    id: int
    school_id: int
    level_id: int
    name: str

    class Config:
        from_attributes = True
