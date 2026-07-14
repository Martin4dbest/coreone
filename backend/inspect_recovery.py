import asyncio
from sqlalchemy import text
from app.db.database import AsyncSessionLocal

async def main():
    async with AsyncSessionLocal() as db:
        print("\n=== SCHOOLS ===")
        result = await db.execute(
            text("SELECT id, name, school_code FROM schools ORDER BY id")
        )
        for row in result.fetchall():
            print(row)

        print("\n=== ROLES ===")
        result = await db.execute(
            text("SELECT id, name FROM roles ORDER BY id")
        )
        for row in result.fetchall():
            print(row)

        print("\n=== USERS ===")
        result = await db.execute(
            text("""
                SELECT
                    u.id,
                    u.email,
                    u.school_id,
                    u.role_id,
                    r.name AS role_name,
                    u.is_active
                FROM users u
                LEFT JOIN roles r ON r.id = u.role_id
                ORDER BY u.id
            """)
        )
        for row in result.fetchall():
            print(row)

asyncio.run(main())
