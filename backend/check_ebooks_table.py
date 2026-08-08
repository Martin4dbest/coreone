import asyncio
from sqlalchemy import text
from app.db.database import engine

async def main():
    async with engine.connect() as conn:

        result = await conn.execute(
            text("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_name = 'ebooks'
            """)
        )

        row = result.first()

        if not row:
            print("❌ ebooks TABLE DOES NOT EXIST")
            return

        print("✅ ebooks TABLE EXISTS")
        print("")
        print("===== EBOOK COLUMNS =====")

        columns = await conn.execute(
            text("""
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'ebooks'
                ORDER BY ordinal_position
            """)
        )

        for column in columns:
            print(f"{column.column_name}: {column.data_type}")

asyncio.run(main())
