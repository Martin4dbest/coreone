from pydantic import BaseModel, ConfigDict, Field


class YoutubeLearningCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    video_url: str = Field(..., min_length=1, max_length=500)
    description: str | None = None
    subject: str | None = None
    class_id: int | None = None
    published: bool = True
    is_active: bool = True


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
    published: bool

    model_config = ConfigDict(from_attributes=True)


class YoutubeLearningActivityResponse(BaseModel):
    success: bool
    video_id: int
