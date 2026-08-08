from fastapi import APIRouter, Depends

from app.core.tenant.context import TenantContext
from app.core.tenant.dependencies import get_current_tenant

router = APIRouter(prefix="/test", tags=["Tenant Test"])


@router.get("/tenant")
async def tenant(
    tenant: TenantContext = Depends(get_current_tenant),
):
    return {
        "resolved": tenant.resolved,
        "school_id": tenant.school_id,
        "school_code": tenant.school_code,
        "domain": tenant.domain,
        "custom_domain": tenant.custom_domain,
        "domain_verified": tenant.domain_verified,
        "tenant_active": tenant.tenant_active,
    }