import asyncio
from sqlalchemy import text

from app.db.database import AsyncSessionLocal


async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            text("SELECT id, title FROM cbt_exams ORDER BY id")
        )

        rows = result.fetchall()

        print("===== CBT EXAMS =====")

        for row in rows:
            print(row.id, row.title)


asyncio.run(main())
