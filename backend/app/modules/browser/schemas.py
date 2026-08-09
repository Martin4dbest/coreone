from pydantic import BaseModel, ConfigDict


class BrowserLinkCreateRequest(BaseModel):
    title: str
    url: str
    description: str | None = None
    category: str | None = None


class BrowserLinkUpdateRequest(BaseModel):
    title: str | None = None
    url: str | None = None
    description: str | None = None
    category: str | None = None
    is_active: bool | None = None


class BrowserLinkResponse(BaseModel):
    id: int
    school_id: int
    title: str
    url: str
    description: str | None = None
    category: str | None = None
    created_by: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
