from pydantic import BaseModel


class BrowserLinkCreateRequest(BaseModel):
    school_id: int
    title: str
    url: str
    description: str | None = None
    category: str | None = None
    created_by: int


class BrowserLinkResponse(BaseModel):
    id: int
    school_id: int
    title: str
    url: str
    description: str | None = None
    category: str | None = None
    created_by: int
    is_active: bool

    class Config:
        from_attributes = True