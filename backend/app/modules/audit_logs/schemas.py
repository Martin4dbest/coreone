from pydantic import BaseModel


class AuditLogCreateRequest(BaseModel):
    school_id: int
    user_id: int
    action: str
    entity: str
    entity_id: int | None = None
    description: str | None = None


class AuditLogResponse(BaseModel):
    id: int
    school_id: int
    user_id: int
    action: str
    entity: str
    entity_id: int | None = None
    description: str | None = None

    class Config:
        from_attributes = True
