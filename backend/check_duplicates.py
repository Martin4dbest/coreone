from sqlalchemy import text
from app.db.database import engine
import asyncio

async def main():

    async with engine.begin() as conn:

        result = await conn.execute(text("""
        SELECT
            r.id,
            s.name,
            r.student_id,
            r.ca_score,
            r.exam_score,
            r.term_id
        FROM results r
        JOIN subjects s ON s.id = r.subject_id
        WHERE r.student_id = 9
        ORDER BY s.name
        """))

        for row in result:
            print(row)

asyncio.run(main())
