from datetime import datetime

from pydantic import BaseModel


class NotificationCreateRequest(BaseModel):
    school_id: int
    title: str
    message: str
    recipient_type: str | None = None


class NotificationResponse(BaseModel):
    id: int
    school_id: int
    title: str
    message: str
    recipient_type: str | None = None
    is_read: bool
    sent_at: datetime
    is_active: bool

    class Config:
        from_attributes = True