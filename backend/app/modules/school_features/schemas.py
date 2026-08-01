from pydantic import BaseModel


class SchoolFeatureResponse(BaseModel):
    id: int
    school_id: int
    feature_key: str
    enabled: bool

    class Config:
        from_attributes = True


class FeatureToggleRequest(BaseModel):
    enabled: bool
