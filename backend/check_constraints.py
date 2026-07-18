from sqlalchemy import text
from app.db.database import engine
import asyncio

async def main():

    async with engine.begin() as conn:

        result = await conn.execute(text("""
        SELECT
            conname,
            pg_get_constraintdef(oid)
        FROM pg_constraint
        WHERE conrelid = 'results'::regclass;
        """))

        for row in result:
            print(row)

asyncio.run(main())
