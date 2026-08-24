from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SchoolBusCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    registration_number: str = Field(
        ...,
        min_length=1,
        max_length=50,
    )
    driver_name: str | None = Field(None, max_length=255)
    driver_phone: str | None = Field(None, max_length=50)
    capacity: int = Field(1, ge=1)


class SchoolBusUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    registration_number: str | None = Field(
        None,
        min_length=1,
        max_length=50,
    )
    driver_name: str | None = Field(None, max_length=255)
    driver_phone: str | None = Field(None, max_length=50)
    capacity: int | None = Field(None, ge=1)
    is_active: bool | None = None


class SchoolBusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    school_id: int
    name: str
    registration_number: str
    driver_name: str | None = None
    driver_phone: str | None = None
    capacity: int
    is_active: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None
