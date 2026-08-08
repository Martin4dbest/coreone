from datetime import datetime

from pydantic import BaseModel


class MessageCreateRequest(BaseModel):
    school_id: int
    sender_id: int
    receiver_id: int
    subject: str | None = None
    content: str


class MessageResponse(BaseModel):
    id: int
    school_id: int
    sender_id: int
    receiver_id: int
    subject: str | None = None
    content: str
    sent_at: datetime
    is_active: bool

    class Config:
        from_attributes = True