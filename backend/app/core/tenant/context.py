from dataclasses import dataclass


@dataclass
class TenantContext:
    school_id: int | None = None
    school_code: str | None = None
    domain: str | None = None
    custom_domain: str | None = None

    tenant_active: bool = False
    domain_verified: bool = False

    resolved: bool = False