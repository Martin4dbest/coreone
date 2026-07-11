from pydantic import BaseModel


class HouseCreateRequest(BaseModel):
    school_id: int
    name: str
    color: str | None = None


class HouseResponse(BaseModel):
    id: int
    school_id: int
    name: str
    color: str | None = None
    is_active: bool

    class Config:
        from_attributes = True
