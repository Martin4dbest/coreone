from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class EbookCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    author: str | None = Field(None, max_length=150)
    description: str | None = None
    file_url: str = Field(..., min_length=1, max_length=500)
    category: str | None = Field(None, max_length=100)

    subject_id: int | None = None
    classroom_id: int | None = None

    cover_image_url: str | None = Field(
        None,
        max_length=500,
    )

    file_name: str | None = Field(
        None,
        max_length=255,
    )

    file_size: int | None = None
    file_type: str | None = Field(None, max_length=100)

    featured: bool = False


class EbookUpdateRequest(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    author: str | None = Field(None, max_length=150)
    description: str | None = None
    category: str | None = Field(None, max_length=100)

    subject_id: int | None = None
    classroom_id: int | None = None

    cover_image_url: str | None = Field(
        None,
        max_length=500,
    )

    file_name: str | None = Field(
        None,
        max_length=255,
    )

    file_size: int | None = None
    file_type: str | None = Field(None, max_length=100)

    featured: bool | None = None


class EbookResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    author: str | None = None
    description: str | None = None

    file_url: str
    category: str | None = None

    uploaded_by: int
    school_id: int

    subject_id: int | None = None
    classroom_id: int | None = None

    cover_image_url: str | None = None

    file_name: str | None = None
    file_size: int | None = None
    file_type: str | None = None

    featured: bool
    download_count: int
    view_count: int

    is_active: bool

    created_at: datetime | None = None
    updated_at: datetime | None = None
