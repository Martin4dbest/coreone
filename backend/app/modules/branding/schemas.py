from pydantic import BaseModel


class BrandingCreateRequest(BaseModel):
    school_id: int
    logo_url: str | None = None
    app_icon_url: str | None = None
    splash_image_url: str | None = None
    primary_color: str = "#2563EB"
    secondary_color: str = "#1E293B"
    accent_color: str = "#F43F5E"
    motto: str | None = None
    login_title: str | None = None
    login_message: str | None = None


class BrandingUpdateRequest(BaseModel):
    logo_url: str | None = None
    app_icon_url: str | None = None
    splash_image_url: str | None = None
    primary_color: str | None = None
    secondary_color: str | None = None
    accent_color: str | None = None
    motto: str | None = None
    login_title: str | None = None
    login_message: str | None = None


class BrandingResponse(BaseModel):
    id: int
    school_id: int
    logo_url: str | None = None
    app_icon_url: str | None = None
    splash_image_url: str | None = None
    primary_color: str
    secondary_color: str
    accent_color: str
    motto: str | None = None
    login_title: str | None = None
    login_message: str | None = None
    is_active: bool

    class Config:
        from_attributes = True