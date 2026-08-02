from datetime import datetime



DEFAULT_PROVIDERS = [

    {
        "provider":"internal",
        "display_name":"Internal CBT",
        "enabled":True,
    },

    {
        "provider":"google_forms",
        "display_name":"Google Forms",
        "enabled":False,
    },

    {
        "provider":"microsoft_forms",
        "display_name":"Microsoft Forms",
        "enabled":False,
    },

    {
        "provider":"moodle",
        "display_name":"Moodle LMS",
        "enabled":False,
    },

    {
        "provider":"canvas",
        "display_name":"Canvas LMS",
        "enabled":False,
    },

    {
        "provider":"blackboard",
        "display_name":"Blackboard",
        "enabled":False,
    },

    {
        "provider":"waec",
        "display_name":"WAEC CBT",
        "enabled":False,
    },

    {
        "provider":"neco",
        "display_name":"NECO CBT",
        "enabled":False,
    },

    {
        "provider":"jamb",
        "display_name":"JAMB CBT",
        "enabled":False,
    },

    {
        "provider":"csv",
        "display_name":"CSV Import",
        "enabled":False,
    },

    {
        "provider":"excel",
        "display_name":"Excel Import",
        "enabled":False,
    },

    {
        "provider":"rest_api",
        "display_name":"REST API",
        "enabled":False,
    },

    {
        "provider":"graphql",
        "display_name":"GraphQL",
        "enabled":False,
    },

    {
        "provider":"ai_generator",
        "display_name":"AI Question Generator",
        "enabled":False,
    },

]

import random

from fastapi import HTTPException
from fastapi import status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cbt_answer import CBTAnswer
from app.models.cbt_attempt import CBTAttempt
from app.models.cbt_exam import CBTExam
from app.models.cbt_question import CBTQuestion
from app.modules.cbt.repository import CBTRepository


class CBTService:

    def __init__(
        self,
        db: AsyncSession,
    ):
        self.db = db
        self.repository = CBTRepository(db)

    # ==================================================
    # EXAMS
    # ==================================================

    async def create_exam(
        self,
        exam: CBTExam,
        current_user,
    ):

        if current_user.role.name != "SUPER_ADMIN":

            exam.school_id = current_user.school_id

        exam.created_by = current_user.id

        return await self.repository.create_exam(
            exam
        )

    async def list_exams(
        self,
        school_id: int,
        current_user,
    ):

        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

        return await self.repository.list_exams(
            school_id
        )

    async def get_exam(
        self,
        exam_id: int,
        current_user,
    ):
        exam = await self.repository.get_exam(
            exam_id
        )

        if exam is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Exam not found",
            )

        if current_user.role.name != "SUPER_ADMIN":

            if exam.school_id != current_user.school_id:
                raise HTTPException(
                    status_code=403,
                    detail="Not allowed for this school",
                )

        return exam

    # ==================================================
    # QUESTIONS
    # ==================================================

    async def add_question(
        self,
        question: CBTQuestion,
        current_user,
    ):

        exam = await self.repository.get_exam(
            question.exam_id
        )

        if exam is None:
            raise HTTPException(
                status_code=404,
                detail="Exam not found",
            )


        if current_user.role.name != "SUPER_ADMIN":

            if exam.school_id != current_user.school_id:
                raise HTTPException(
                    status_code=403,
                    detail="Not allowed for this school",
                )


        return await self.repository.add_question(
            question
        )

    async def get_questions(
        self,
        exam_id: int,
        current_user,
        randomize: bool = True,
    ):
        exam = await self.repository.get_exam(
            exam_id
        )

        if exam is None:
            raise HTTPException(
                status_code=404,
                detail="Exam not found",
            )

        if current_user.role.name != "SUPER_ADMIN":

            if exam.school_id != current_user.school_id:
                raise HTTPException(
                    status_code=403,
                    detail="Not allowed for this school",
                )

        questions = await self.repository.get_questions(
            exam_id
        )

        if randomize:
            random.shuffle(
                questions
            )

        return questions

    # ==================================================
    # ATTEMPTS
    # ==================================================

    async def start_attempt(
        self,
        attempt: CBTAttempt,
    ):
        return await self.repository.create_attempt(
            attempt
        )

    async def save_answer(
        self,
        answer: CBTAnswer,
    ):
        return await self.repository.save_answer(
            answer
        )

    # ==================================================
    # AUTO MARKING
    # ==================================================

    async def auto_mark(
        self,
        attempt_id: int,
    ):

        attempt = await self.repository.get_attempt(
            attempt_id
        )

        if attempt is None:
            raise HTTPException(
                status_code=404,
                detail="Attempt not found",
            )

        answers = await self.repository.get_answers(
            attempt_id
        )

        score = 0

        for answer in answers:

            question = await self.repository.db.get(
                CBTQuestion,
                answer.question_id,
            )

            if question is None:
                continue

            if (
                answer.selected_answer
                ==
                question.correct_answer
            ):
                answer.is_correct = True
                answer.marks_awarded = question.marks
                score += question.marks

            else:
                answer.is_correct = False

                if attempt.negative_marking:
                    score -= attempt.negative_mark

        attempt.score = score

        exam = await self.repository.get_exam(
            attempt.exam_id
        )

        if exam:

            attempt.percentage = (
                score / exam.total_marks
            ) * 100

            attempt.passed = (
                attempt.percentage
                >=
                exam.pass_mark
            )

        attempt.completed = True
        attempt.submitted_at = datetime.utcnow()

        await self.repository.update_attempt(
            attempt
        )

        return attempt

    # ==================================================
    # RESUME EXAM
    # ==================================================

    async def resume_attempt(
        self,
        attempt_id: int,
    ):

        raise NotImplementedError

    # ==================================================
    # EXTERNAL PROVIDERS
    # ==================================================

    async def import_from_provider(
        self,
        provider: str,
    ):

        raise NotImplementedError

    # ==================================================
    # AI QUESTION GENERATION
    # ==================================================

    async def generate_ai_questions(
        self,
    ):

        raise NotImplementedError

    # ==================================================
    # LIVE MONITORING
    # ==================================================

    async def monitor_exam(
        self,
    ):

        raise NotImplementedError

    # ==================================================
    # ANALYTICS
    # ==================================================

    async def analytics(
        self,
    ):

        raise NotImplementedError


    async def initialize_default_providers(
        self,
        school_id:int,
    ):

        from app.models.cbt_provider import CBTProvider

        for provider in DEFAULT_PROVIDERS:

            self.repository.db.add(

                CBTProvider(

                    school_id=school_id,

                    provider=provider["provider"],

                    display_name=provider["display_name"],

                    enabled=provider["enabled"],

                    is_active=True,

                )

            )

        await self.repository.db.commit()


    async def update_exam(
        self,
        exam_id: int,
        payload,
        current_user,
    ):
        exam = await self.get_exam(
            exam_id,
            current_user,
        )

        data = payload.model_dump(exclude_unset=True)

        for key, value in data.items():
            setattr(exam, key, value)

        return await self.repository.update_exam(
            exam
        )

    async def delete_exam(
        self,
        exam_id: int,
        current_user,
    ):
        exam = await self.get_exam(
            exam_id,
            current_user,
        )

        await self.repository.delete_exam(
            exam
        )

        return {
            "success": True,
            "message": "Exam deleted successfully",
        }

    async def duplicate_exam(
        self,
        exam_id: int,
        current_user,
    ):
        exam = await self.get_exam(
            exam_id,
            current_user,
        )

        exam.title = f"{exam.title} (Copy)"

        return await self.repository.duplicate_exam(
            exam
        )


    async def publish_exam(
        self,
        exam_id: int,
        current_user,
    ):
        exam = await self.get_exam(exam_id, current_user)

        exam.is_active = True

        return await self.repository.update_exam(exam)

    async def unpublish_exam(
        self,
        exam_id: int,
        current_user,
    ):
        exam = await self.get_exam(exam_id, current_user)

        exam.is_active = False

        return await self.repository.update_exam(exam)

