import asyncio

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.school import School


async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(
                School.id,
                School.name,
                School.school_code,
            )
        )

        rows = result.all()

        print("\n===== SCHOOLS =====")
        if not rows:
            print("No schools found.")
            return

        for row in rows:
            print(row)


if __name__ == "__main__":
    asyncio.run(main())
