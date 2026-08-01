from pydantic import BaseModel


class ProviderResponse(BaseModel):

    id: int

    school_id: int

    provider: str

    display_name: str

    enabled: bool

    api_url: str | None = None

    sync_results: bool

    auto_import: bool

    auto_export: bool

    class Config:
        from_attributes = True


class ProviderUpdateRequest(BaseModel):

    enabled: bool

    api_url: str | None = None

    api_key: str | None = None

    oauth_client_id: str | None = None

    oauth_client_secret: str | None = None

    refresh_token: str | None = None

    drive_folder_id: str | None = None

    sync_results: bool = True

    auto_import: bool = False

    auto_export: bool = False
