import asyncio

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.school import School
from app.models.school_feature import SchoolFeature


FEATURES = [
    "students",
    "teachers",
    "staff",
    "classes",
    "academics",
    "attendance",
    "learning",
    "ebooks",
    "browser",
    "youtube_learning",
    "cbt",
    "results",
    "events",
    "settings",
    "branding",
]


async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(School))
        schools = result.scalars().all()

        created = 0
        existing = 0

        for school in schools:
            for feature_key in FEATURES:
                result = await db.execute(
                    select(SchoolFeature).where(
                        SchoolFeature.school_id == school.id,
                        SchoolFeature.feature_key == feature_key,
                    )
                )

                feature = result.scalar_one_or_none()

                if feature:
                    existing += 1
                else:
                    db.add(
                        SchoolFeature(
                            school_id=school.id,
                            feature_key=feature_key,
                            enabled=True,
                        )
                    )
                    created += 1

        await db.commit()

        print(f"SCHOOLS FOUND: {len(schools)}")
        print(f"EXISTING FEATURES: {existing}")
        print(f"CREATED FEATURES: {created}")
        print("DONE: all schools now have all 15 feature records.")


if __name__ == "__main__":
    asyncio.run(main())
