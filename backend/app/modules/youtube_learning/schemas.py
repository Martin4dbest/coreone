from pydantic import BaseModel


class YoutubeLearningCreateRequest(BaseModel):
    school_id: int
    title: str
    video_url: str
    description: str | None = None
    subject: str | None = None
    class_id: int | None = None
    uploaded_by: int


class YoutubeLearningResponse(BaseModel):
    id: int
    school_id: int
    title: str
    video_url: str
    description: str | None = None
    subject: str | None = None
    class_id: int | None = None
    uploaded_by: int
    is_active: bool

    class Config:
        from_attributes = True
