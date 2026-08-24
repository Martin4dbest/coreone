from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SchoolBookCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    author: str | None = Field(None, max_length=255)
    isbn: str | None = Field(None, max_length=100)
    category: str | None = Field(None, max_length=100)
    subject_id: int | None = None
    quantity: int = Field(1, ge=0)


class SchoolBookUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    author: str | None = Field(None, max_length=255)
    isbn: str | None = Field(None, max_length=100)
    category: str | None = Field(None, max_length=100)
    subject_id: int | None = None
    quantity: int | None = Field(None, ge=0)
    is_active: bool | None = None


class SchoolBookResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    school_id: int
    title: str
    author: str | None = None
    isbn: str | None = None
    category: str | None = None
    subject_id: int | None = None
    quantity: int
    is_active: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None
