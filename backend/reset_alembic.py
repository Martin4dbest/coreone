from sqlalchemy import text
import asyncio

from app.db.database import AsyncSessionLocal


async def main():
    async with AsyncSessionLocal() as db:
        await db.execute(
            text(
                "UPDATE alembic_version SET version_num='e3dbdaf5bd2f'"
            )
        )
        await db.commit()

    print("Alembic reset done")


asyncio.run(main())
