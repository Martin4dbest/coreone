from pydantic import BaseModel


class GoogleOAuthURLResponse(BaseModel):
    authorization_url: str


class GoogleOAuthCallbackRequest(BaseModel):
    code: str


class GoogleConnectionResponse(BaseModel):
    connected: bool
    email: str | None = None
    expires_in: int | None = None


class GoogleImportRequest(BaseModel):
    form_id: str


class GoogleExportRequest(BaseModel):
    exam_id: int


class GoogleSyncRequest(BaseModel):
    exam_id: int
