from pydantic import BaseModel


class GradingSystemCreateRequest(BaseModel):
    school_id: int
    grade: str
    minimum_score: float
    maximum_score: float
    remark: str


class GradingSystemResponse(BaseModel):
    id: int
    school_id: int
    grade: str
    minimum_score: float
    maximum_score: float
    remark: str
    is_active: bool

    class Config:
        from_attributes = True
