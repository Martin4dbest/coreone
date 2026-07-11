from pydantic import BaseModel


class EbookCreateRequest(BaseModel):
    school_id: int
    title: str
    author: str | None = None
    description: str | None = None
    file_url: str
    category: str | None = None
    uploaded_by: int


class EbookResponse(BaseModel):
    id: int
    school_id: int
    title: str
    author: str | None = None
    description: str | None = None
    file_url: str
    category: str | None = None
    uploaded_by: int
    is_active: bool

    class Config:
        from_attributes = True
