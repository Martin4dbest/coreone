import asyncio
from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.teacher_subject import TeacherSubject

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(TeacherSubject).where(
                TeacherSubject.teacher_id == 3
            )
        )

        rows = result.scalars().all()

        print(f"Assignments found: {len(rows)}")

        for row in rows:
            print({
                "teacher_id": row.teacher_id,
                "classroom_id": row.classroom_id,
                "subject_id": row.subject_id,
                "school_id": row.school_id,
                "is_active": row.is_active,
            })

asyncio.run(main())
