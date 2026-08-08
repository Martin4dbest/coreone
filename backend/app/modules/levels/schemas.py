from pydantic import BaseModel


class LevelCreateRequest(BaseModel):
    school_id: int
    name: str


class LevelResponse(BaseModel):
    id: int
    school_id: int
    name: str
    is_active: bool

    class Config:
        from_attributes = True