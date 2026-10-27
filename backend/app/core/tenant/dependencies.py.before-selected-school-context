from fastapi import HTTPException, Request, status, Depends

from app.core.tenant.context import TenantContext
from app.models.user import User

from app.modules.auth.dependencies.current_user import get_current_user


# Used before login
# Resolves tenant only from request/domain

async def get_current_tenant(
    request: Request,
) -> TenantContext:

    tenant = getattr(request.state, "tenant", None)

    if tenant is None or not tenant.resolved:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant could not be resolved.",
        )

    if not tenant.tenant_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant is inactive.",
        )

    return tenant



# Used during login.
#
# The CoreOne master portal intentionally has NO tenant.
# Therefore an unresolved tenant is allowed at this stage.
#
# Once the user is authenticated, the login router enforces:
#   - unresolved tenant -> SUPER_ADMIN only
#   - resolved tenant   -> normal tenant authentication
#
async def get_login_tenant(
    request: Request,
) -> TenantContext:

    tenant = getattr(request.state, "tenant", None)

    if tenant is None:
        return TenantContext()

    if tenant.resolved and not tenant.tenant_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant is inactive.",
        )

    if tenant.resolved:
        return tenant

    # Master CoreOne portal:
    # no tenant is expected here.
    return TenantContext()


# Used after login
# Applies SCHOOL_ADMIN isolation

async def get_tenant_from_request(
    request: Request,
    current_user: User = Depends(get_current_user),
) -> TenantContext:

    tenant = getattr(request.state, "tenant", None)

    # =========================================================
    # SUPER ADMIN
    # =========================================================
    # SUPER_ADMIN operates from the CoreOne master portal.
    # The master portal does not resolve to a school tenant.
    #
    # Therefore an unresolved tenant is allowed for SUPER_ADMIN.
    # Endpoints that accept school_id must use that explicitly
    # requested school.
    # =========================================================

    if current_user.role.name == "SUPER_ADMIN":

        if tenant is None or not tenant.resolved:
            print(
                "SUPER_ADMIN MASTER PORTAL: "
                "allowing unresolved tenant"
            )
            return TenantContext()

        if not tenant.tenant_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tenant is inactive.",
            )

        return tenant

    # =========================================================
    # SCHOOL ADMIN / NORMAL TENANT USERS
    # =========================================================

    if tenant is None or not tenant.resolved:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant could not be resolved.",
        )

    if not tenant.tenant_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant is inactive.",
        )

    if current_user.role.name == "SCHOOL_ADMIN":
        tenant = TenantContext(
            school_id=current_user.school_id,
            school_code=tenant.school_code,
            domain=tenant.domain,
            custom_domain=tenant.custom_domain,
            tenant_active=tenant.tenant_active,
            domain_verified=tenant.domain_verified,
            resolved=True,
        )

    print(
        "FINAL TENANT DEBUG:",
        current_user.email,
        tenant,
    )

    return tenant

