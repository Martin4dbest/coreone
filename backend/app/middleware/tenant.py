from starlette.middleware.base import BaseHTTPMiddleware

from app.core.tenant.context import TenantContext
from app.core.tenant.resolver import TenantResolver
from app.db.database import AsyncSessionLocal
from app.models.school import School
from sqlalchemy import select


class TenantMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request, call_next):

        tenant = TenantContext()

        host = request.headers.get("host", "")
        tenant_header = request.headers.get("X-Tenant")

        print("=" * 60)
        print("HOST HEADER:", host)
        print("X-TENANT HEADER:", tenant_header)
        print("=" * 60)

        async with AsyncSessionLocal() as db:

            school = None

            # 1. URL tenant resolution
            if tenant_header:

                result = await db.execute(
                    select(School).where(
                        School.school_code == tenant_header.upper()
                    )
                )

                school = result.scalar_one_or_none()


            # 2. Domain resolution fallback
            if school is None:
                school = await TenantResolver.resolve(
                    db,
                    host
                )


            print("RESOLVED SCHOOL:", school)


            if school:
                tenant.school_id = school.id
                tenant.school_code = school.school_code
                tenant.domain = school.domain
                tenant.custom_domain = school.custom_domain
                tenant.domain_verified = school.domain_verified
                tenant.tenant_active = school.tenant_active
                tenant.resolved = True


        print("TENANT:", tenant)

        request.state.tenant = tenant

        return await call_next(request)
