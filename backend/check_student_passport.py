from sqlalchemy import text
from app.db.database import engine
import asyncio

async def main():
    async with engine.begin() as conn:
        result = await conn.execute(text("""
        SELECT
            id,
            first_name,
            last_name,
            passport
        FROM students
        WHERE id = 9
        """))

        print(result.mappings().first())

asyncio.run(main())
