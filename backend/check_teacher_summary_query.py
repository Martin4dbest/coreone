import asyncio

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.classroom import Classroom
from app.models.subject import Subject
from app.models.teacher_subject import TeacherSubject

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(
                Classroom.name.label("classroom_name"),
                Subject.name.label("subject_name"),
            )
            .select_from(TeacherSubject)
            .join(
                Classroom,
                Classroom.id == TeacherSubject.classroom_id,
            )
            .join(
                Subject,
                Subject.id == TeacherSubject.subject_id,
            )
            .where(
                TeacherSubject.teacher_id == 3,
                TeacherSubject.is_active == True,
            )
        )

        rows = result.all()

        print(f"Rows returned: {len(rows)}")
        print()

        for row in rows:
            print(
                {
                    "classroom": row.classroom_name,
                    "subject": row.subject_name,
                }
            )

asyncio.run(main())
