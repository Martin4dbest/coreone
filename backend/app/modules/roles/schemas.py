from pydantic import BaseModel


class RoleCreateRequest(BaseModel):
    name: str
    description: str | None = None


class RoleResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    is_active: bool

    class Config:
        from_attributes = True