import asyncio

from sqlalchemy import text
from app.db.database import AsyncSessionLocal


async def check():

    async with AsyncSessionLocal() as db:

        result = await db.execute(
            text("""
                SELECT
                    id,
                    student_id,
                    subject_id,
                    total_score,
                    is_active
                FROM results
                WHERE student_id = 141;
            """)
        )

        rows = result.all()

        print("===== RESULT ROWS =====")

        for row in rows:
            print(row)


asyncio.run(check())
