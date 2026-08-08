from datetime import datetime

from pydantic import BaseModel


class VisitorCreateRequest(BaseModel):
    school_id: int
    full_name: str
    phone: str
    purpose: str
    person_to_visit: str | None = None


class VisitorResponse(BaseModel):
    id: int
    school_id: int
    full_name: str
    phone: str
    purpose: str
    person_to_visit: str | None = None
    check_in_time: datetime
    check_out_time: datetime | None = None

    class Config:
        from_attributes = True