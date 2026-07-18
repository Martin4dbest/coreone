from sqlalchemy import text
from app.db.database import engine
import asyncio

async def main():

    async with engine.begin() as conn:
        await conn.execute(text("""
            DELETE FROM results
            WHERE id = 21
        """))

        print("Deleted duplicate result")

asyncio.run(main())
