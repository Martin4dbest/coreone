import asyncio
from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.school_branding import SchoolBranding

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(
                SchoolBranding.school_id,
                SchoolBranding.logo_url,
                SchoolBranding.splash_image_url,
                SchoolBranding.primary_color,
                SchoolBranding.secondary_color,
                SchoolBranding.motto,
            )
        )

        rows = result.all()

        print("\n===== SCHOOL BRANDING =====")

        if not rows:
            print("NO BRANDING RECORDS FOUND")
            return

        for row in rows:
            print(row)

if __name__ == "__main__":
    asyncio.run(main())
