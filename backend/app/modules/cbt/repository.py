from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cbt_exam import CBTExam
from app.models.cbt_question import CBTQuestion
from app.models.cbt_attempt import CBTAttempt
from app.models.cbt_answer import CBTAnswer


class CBTRepository:

    def __init__(
        self,
        db: AsyncSession,
    ):
        self.db = db

    # -------------------------
    # Exams
    # -------------------------

    async def create_exam(
        self,
        exam: CBTExam,
    ):
        self.db.add(exam)
        await self.db.commit()
        await self.db.refresh(exam)
        return exam

    async def get_exam(
        self,
        exam_id: int,
    ):
        result = await self.db.execute(
            select(CBTExam).where(
                CBTExam.id == exam_id
            )
        )
        return result.scalar_one_or_none()

    async def list_exams(
        self,
        school_id: int,
    ):
        result = await self.db.execute(
            select(CBTExam)
            .where(
                CBTExam.school_id == school_id
            )
            .order_by(
                CBTExam.created_at.desc()
            )
        )
        return result.scalars().all()

    # -------------------------
    # Questions
    # -------------------------

    async def add_question(
        self,
        question: CBTQuestion,
    ):
        self.db.add(question)
        await self.db.commit()
        await self.db.refresh(question)
        return question

    async def get_questions(
        self,
        exam_id: int,
    ):
        result = await self.db.execute(
            select(CBTQuestion)
            .where(
                CBTQuestion.exam_id == exam_id
            )
        )
        return result.scalars().all()

    # -------------------------
    # Attempts
    # -------------------------

    async def create_attempt(
        self,
        attempt: CBTAttempt,
    ):
        self.db.add(attempt)
        await self.db.commit()
        await self.db.refresh(attempt)
        return attempt

    async def save_answer(
        self,
        answer: CBTAnswer,
    ):
        self.db.add(answer)
        await self.db.commit()
        await self.db.refresh(answer)
        return answer


    # -------------------------
    # Auto Marking
    # -------------------------

    async def get_attempt(
        self,
        attempt_id: int,
    ):
        result = await self.db.execute(
            select(CBTAttempt).where(
                CBTAttempt.id == attempt_id
            )
        )
        return result.scalar_one_or_none()


    async def get_answers(
        self,
        attempt_id: int,
    ):
        result = await self.db.execute(
            select(CBTAnswer).where(
                CBTAnswer.attempt_id == attempt_id
            )
        )
        return result.scalars().all()


    async def update_attempt(
        self,
        attempt,
    ):
        await self.db.commit()
        await self.db.refresh(
            attempt
        )
        return attempt

