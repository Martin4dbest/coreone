from pydantic import BaseModel


class GalleryCreateRequest(BaseModel):
    school_id: int
    title: str
    image_url: str
    description: str | None = None
    category: str | None = None
    uploaded_by: int


class GalleryResponse(BaseModel):
    id: int
    school_id: int
    title: str
    image_url: str
    description: str | None = None
    category: str | None = None
    uploaded_by: int
    is_active: bool

    class Config:
        from_attributes = True