from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cbt_exam import CBTExam
from app.models.cbt_question import CBTQuestion
from app.models.cbt_attempt import CBTAttempt
from app.models.cbt_answer import CBTAnswer


class CBTRepository:


    async def clear_results(
        self,
        school_id: int,
    ):
        from sqlalchemy import delete
        from app.models.cbt_attempt import CBTAttempt
        from app.models.cbt_answer import CBTAnswer
        from app.models.cbt_exam import CBTExam

        exam_ids = (
            await self.db.execute(
                select(CBTExam.id).where(
                    CBTExam.school_id == school_id
                )
            )
        ).scalars().all()

        if not exam_ids:
            return 0

        attempt_ids = (
            await self.db.execute(
                select(CBTAttempt.id).where(
                    CBTAttempt.exam_id.in_(exam_ids)
                )
            )
        ).scalars().all()

        if attempt_ids:
            await self.db.execute(
                delete(CBTAnswer).where(
                    CBTAnswer.attempt_id.in_(attempt_ids)
                )
            )

        result = await self.db.execute(
            delete(CBTAttempt).where(
                CBTAttempt.exam_id.in_(exam_ids)
            )
        )

        await self.db.commit()

        return result.rowcount

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
            select(CBTExam)
            .options(
                selectinload(CBTExam.subject),
                selectinload(CBTExam.classroom),
                selectinload(CBTExam.questions),
            )
            .where(
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
            .options(
                selectinload(CBTExam.subject),
                selectinload(CBTExam.classroom),
                selectinload(CBTExam.questions),
            )
            .where(
                CBTExam.school_id == school_id
            )
            .order_by(
                CBTExam.created_at.desc()
            )
        )

        exams = result.scalars().all()

        response = []

        for exam in exams:
            response.append({
                "id": exam.id,
                "school_id": exam.school_id,
                "title": exam.title,
                "description": exam.description,

                "subject_id": exam.subject_id,
                "class_id": exam.class_id,

                "duration_minutes": exam.duration_minutes,
                "total_questions": len(exam.questions),

                "total_marks": exam.total_marks,
                "pass_mark": exam.pass_mark,

                "randomize_questions": exam.randomize_questions,
                "randomize_options": exam.randomize_options,
                "allow_resume": exam.allow_resume,
                "show_result_immediately": exam.show_result_immediately,

                "negative_marking": exam.negative_marking,
                "negative_mark": exam.negative_mark,

                "is_active": exam.is_active,

                "status": "Published" if exam.is_active else "Draft",

                "created_at": exam.created_at,
            })

        return response

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
        result = await self.db.execute(
            select(CBTAnswer).where(
                CBTAnswer.attempt_id == answer.attempt_id,
                CBTAnswer.question_id == answer.question_id,
            )
        )

        existing = result.scalar_one_or_none()

        if existing:
            existing.selected_answer = answer.selected_answer
            existing.flagged = answer.flagged

            await self.db.commit()
            await self.db.refresh(existing)

            return existing

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


    async def update_exam(
        self,
        exam: CBTExam,
    ):
        await self.db.commit()
        await self.db.refresh(exam)
        return exam

    async def delete_exam(
        self,
        exam: CBTExam,
    ):
        await self.db.delete(exam)
        await self.db.commit()

    async def duplicate_exam(
        self,
        exam: CBTExam,
    ):
        data = {
            c.name: getattr(exam, c.name)
            for c in CBTExam.__table__.columns
            if c.name not in (
                "id",
                "uuid",
                "created_at",
                "updated_at",
            )
        }

        # IMPORTANT:
        # Do not copy the original UUID when duplicating an exam.
        # CBTExam must generate a fresh UUID for the duplicate.
        duplicate = CBTExam(**data)
        self.db.add(duplicate)
        await self.db.commit()
        await self.db.refresh(duplicate)
        return duplicate