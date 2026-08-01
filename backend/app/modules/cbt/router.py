from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user

from app.models.cbt_exam import CBTExam
from app.models.cbt_question import CBTQuestion
from app.models.cbt_attempt import CBTAttempt
from app.models.cbt_answer import CBTAnswer

from app.modules.cbt.schemas import (
    CBTExamCreateRequest,
    CBTExamResponse,
    CBTQuestionCreateRequest,
    CBTQuestionResponse,
    CBTAttemptCreateRequest,
    CBTAttemptResponse,
    CBTAnswerRequest,
    CBTAnswerResponse,
)

from app.modules.cbt.service import CBTService

router = APIRouter(
    prefix="/cbt",
    tags=["Computer Based Test"],
)

# =====================================================
# EXAMS
# =====================================================

@router.post(
    "/exams",
    response_model=CBTExamResponse,
)
async def create_exam(
    payload: CBTExamCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    exam = CBTExam(**payload.model_dump())

    return await CBTService(db).create_exam(
        exam,
        current_user
    )


@router.get(
    "/schools/{school_id}/exams",
    response_model=list[CBTExamResponse],
)
async def list_exams(
    school_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await CBTService(db).list_exams(
        school_id,
        current_user
    )


@router.get(
    "/exams/{exam_id}",
    response_model=CBTExamResponse,
)
async def get_exam(
    exam_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await CBTService(db).get_exam(
        exam_id,
        current_user
    )

# =====================================================
# QUESTIONS
# =====================================================

@router.post(
    "/questions",
    response_model=CBTQuestionResponse,
)
async def create_question(
    payload: CBTQuestionCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    question = CBTQuestion(
        **payload.model_dump()
    )

    return await CBTService(db).add_question(
        question,
        current_user
    )


@router.get(
    "/exams/{exam_id}/questions",
    response_model=list[CBTQuestionResponse],
)
async def list_questions(
    exam_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await CBTService(db).get_questions(
        exam_id,
        current_user
    )

# =====================================================
# ATTEMPTS
# =====================================================

@router.post(
    "/attempts",
    response_model=CBTAttemptResponse,
)
async def start_attempt(
    payload: CBTAttemptCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    attempt = CBTAttempt(
        **payload.model_dump()
    )

    return await CBTService(db).start_attempt(
        attempt
    )

# =====================================================
# ANSWERS
# =====================================================

@router.post(
    "/attempts/{attempt_id}/answers",
    response_model=CBTAnswerResponse,
)
async def submit_answer(
    attempt_id: int,
    payload: CBTAnswerRequest,
    db: AsyncSession = Depends(get_db),
):
    answer = CBTAnswer(
        attempt_id=attempt_id,
        **payload.model_dump()
    )

    return await CBTService(db).save_answer(
        answer
    )
