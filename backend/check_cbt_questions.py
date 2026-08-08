import asyncio
from sqlalchemy import text
from app.db.database import AsyncSessionLocal


async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            text("""
            SELECT id, exam_id, question, correct_answer
            FROM cbt_questions
            ORDER BY id DESC
            LIMIT 10
            """)
        )

        print("===== CBT QUESTIONS =====")

        for row in result.fetchall():
            print(
                row.id,
                row.exam_id,
                row.question,
                row.correct_answer
            )


asyncio.run(main())
