from pydantic import BaseModel


class EbookCreateRequest(BaseModel):
    title: str
    author: str | None = None
    description: str | None = None
    file_url: str
    category: str | None = None


class EbookResponse(BaseModel):
    id: int
    title: str
    author: str | None = None
    description: str | None = None
    file_url: str
    category: str | None = None
    is_active: bool

    class Config:
        from_attributes = True
