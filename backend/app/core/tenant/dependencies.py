from fastapi import HTTPException, Request, status, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.tenant.context import TenantContext
from app.db.database import get_db
from app.models.school import School
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user


# Used before login.
# Resolves tenant only from request/domain.
async def get_current_tenant(request: Request) -> TenantContext:
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
# The CoreOne master portal intentionally has no tenant.
async def get_login_tenant(request: Request) -> TenantContext:
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

    return TenantContext()


# Used after login.
# School Admins remain restricted to their own school.
# Super Admin requests from a school-specific dashboard page
# may explicitly identify the selected school through X-School-ID.
async def get_tenant_from_request(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TenantContext:
    tenant = getattr(request.state, "tenant", None)

    if current_user.role.name == "SUPER_ADMIN":
        selected_school_header = request.headers.get("X-School-ID")

        if selected_school_header is not None:
            try:
                selected_school_id = int(selected_school_header)
                if selected_school_id <= 0:
                    raise ValueError
            except (TypeError, ValueError):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid selected school ID.",
                )

            result = await db.execute(
                select(School.id).where(School.id == selected_school_id)
            )

            if result.scalar_one_or_none() is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Selected school was not found.",
                )

            same_tenant = (
                tenant is not None
                and tenant.resolved
                and tenant.school_id == selected_school_id
            )

            return TenantContext(
                school_id=selected_school_id,
                school_code=(
                    tenant.school_code if same_tenant else None
                ),
                domain=tenant.domain if same_tenant else None,
                custom_domain=(
                    tenant.custom_domain if same_tenant else None
                ),
                tenant_active=True,
                domain_verified=(
                    tenant.domain_verified if same_tenant else False
                ),
                resolved=True,
            )

        # Keep existing master-portal behaviour for requests
        # that do not come from a school-specific dashboard page.
        if tenant is None or not tenant.resolved:
            return TenantContext()

        if not tenant.tenant_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tenant is inactive.",
            )

        return tenant

    # Normal tenant users must have a resolved, active tenant.
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
