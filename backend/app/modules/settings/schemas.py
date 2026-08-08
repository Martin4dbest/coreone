from pydantic import BaseModel


class SettingCreateRequest(BaseModel):
    school_id: int
    key: str
    value: str | None = None
    description: str | None = None


class SettingUpdateRequest(BaseModel):
    key: str
    value: str | None = None
    description: str | None = None


class SettingResponse(BaseModel):
    id: int
    school_id: int
    key: str
    value: str | None = None
    description: str | None = None
    is_active: bool

    class Config:
        from_attributes = True