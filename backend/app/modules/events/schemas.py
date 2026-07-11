from datetime import datetime

from pydantic import BaseModel


class EventCreateRequest(BaseModel):
    school_id: int
    title: str
    description: str | None = None
    event_date: datetime
    location: str | None = None


class EventResponse(BaseModel):
    id: int
    school_id: int
    title: str
    description: str | None = None
    event_date: datetime
    location: str | None = None
    is_active: bool

    class Config:
        from_attributes = True
