from sqlalchemy import or_, select

from app.models.school import School


class TenantResolver:

    @staticmethod
    async def resolve(db, host: str):
        host = host.lower().split(":")[0]

        aliases = {host}

        if host == "127.0.0.1":
            aliases.add("localhost")

        if host == "localhost":
            aliases.add("127.0.0.1")

        stmt = (
            select(School)
            .where(
                or_(
                    School.domain.in_(aliases),
                    School.custom_domain.in_(aliases),
                )
            )
        )

        result = await db.execute(stmt)

        return result.scalar_one_or_none()