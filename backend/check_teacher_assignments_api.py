import asyncio
import json

from app.db.database import AsyncSessionLocal
from app.modules.teacher_assignments.repository import (
    TeacherAssignmentRepository,
)

async def main():
    async with AsyncSessionLocal() as db:
        repo = TeacherAssignmentRepository(db)

        assignments = await repo.get_teacher_assignments(
            teacher_id=3,
            school_id=9,
        )

        print(f"Assignments returned: {len(assignments)}")
        print()

        for a in assignments:
            print(json.dumps(
                {
                    "id": a.id,
                    "teacher_id": a.teacher_id,
                    "classroom_id": a.classroom_id,
                    "subject_id": a.subject_id,
                    "school_id": a.school_id,
                    "academic_session_id": a.academic_session_id,
                    "is_active": a.is_active,
                },
                indent=2,
            ))

asyncio.run(main())
