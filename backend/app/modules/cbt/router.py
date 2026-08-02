from sqlalchemy import select
from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user

from app.models.cbt_exam import CBTExam
from app.models.cbt_question import CBTQuestion
from app.models.cbt_attempt import CBTAttempt
from app.models.student import Student
from sqlalchemy import select
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
    data = payload.model_dump()

    data.pop("audio_url", None)
    data.pop("video_url", None)

    question = CBTQuestion(**data)

    return await CBTService(db).add_question(
        question,
        current_user
    )


@router.post(
    "/questions/{question_id}/update",
)
async def update_question(
    question_id: int,
    payload: CBTQuestionCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    result = await db.execute(
        select(CBTQuestion)
        .where(CBTQuestion.id == question_id)
    )

    question = result.scalar_one_or_none()

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found"
        )

    data = payload.model_dump()

    data.pop("audio_url", None)
    data.pop("video_url", None)

    for key, value in data.items():
        setattr(question, key, value)

    await db.commit()
    await db.refresh(question)

    return question





@router.post(
    "/questions/{question_id}/duplicate",
    response_model=CBTQuestionResponse,
)
async def duplicate_question(
    question_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    result = await db.execute(
        select(CBTQuestion)
        .where(CBTQuestion.id == question_id)
    )

    original = result.scalar_one_or_none()

    if not original:
        raise HTTPException(
            status_code=404,
            detail="Question not found"
        )

    duplicate = CBTQuestion(
        exam_id=original.exam_id,
        question=original.question + " (Copy)",
        image_url=original.image_url,
        option_a=original.option_a,
        option_b=original.option_b,
        option_c=original.option_c,
        option_d=original.option_d,
        option_e=original.option_e,
        correct_answer=original.correct_answer,
        explanation=original.explanation,
        marks=original.marks,
        randomize_options=original.randomize_options,
    )

    db.add(duplicate)
    await db.commit()
    await db.refresh(duplicate)

    return duplicate



@router.post(
    "/questions/{question_id}/delete",
)
async def delete_question(
    question_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    result = await db.execute(
        select(CBTQuestion)
        .where(CBTQuestion.id == question_id)
    )

    question = result.scalar_one_or_none()

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found"
        )

    await db.delete(question)
    await db.commit()

    return {
        "message": "Question deleted successfully"
    }



@router.get(
    "/student/exams",
)
async def student_available_exams(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    exams = await db.execute(
        select(CBTExam)
        .where(
            CBTExam.school_id == current_user.school_id,
            CBTExam.is_active == True,
        )
    )

    return exams.scalars().all()


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
    current_user: User = Depends(get_current_user),
):
    print("========== START CBT ATTEMPT ==========")
    print("CURRENT USER:", current_user)
    print("USER ID:", current_user.id)
    print("EXAM ID:", payload.exam_id)

    student_result = await db.execute(
        select(Student).where(
            Student.user_id == current_user.id
        )
    )

    student = student_result.scalar_one_or_none()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found"
        )

    attempt = CBTAttempt(
        exam_id=payload.exam_id,
        student_id=student.id,
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


@router.put(
    "/exams/{exam_id}",
    response_model=CBTExamResponse,
)
async def update_exam(
    exam_id: int,
    payload: CBTExamCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await CBTService(db).update_exam(
        exam_id,
        payload,
        current_user,
    )


@router.delete(
    "/exams/{exam_id}",
)
async def delete_exam(
    exam_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await CBTService(db).delete_exam(
        exam_id,
        current_user,
    )


@router.post(
    "/exams/{exam_id}/duplicate",
    response_model=CBTExamResponse,
)
async def duplicate_exam(
    exam_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await CBTService(db).duplicate_exam(
        exam_id,
        current_user,
    )



@router.post(
    "/exams/{exam_id}/publish",
    response_model=CBTExamResponse,
)
async def publish_exam(
    exam_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    exam = await CBTService(db).publish_exam(
        exam_id,
        current_user,
    )

    exam.status = "Published" if exam.is_active else "Draft"

    return exam


@router.post(
    "/exams/{exam_id}/unpublish",
    response_model=CBTExamResponse,
)
async def unpublish_exam(
    exam_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await CBTService(db).unpublish_exam(
        exam_id,
        current_user,
    )


from fastapi import UploadFile, File
from pathlib import Path
from uuid import uuid4
import shutil

UPLOAD_ROOT = Path("app/uploads/cbt")


@router.post("/upload/image")
async def upload_cbt_image(
    file: UploadFile = File(...),
):
    ext = Path(file.filename).suffix.lower()
    filename = f"{uuid4().hex}{ext}"

    folder = UPLOAD_ROOT / "images"
    folder.mkdir(parents=True, exist_ok=True)

    filepath = folder / filename

    with filepath.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "url": f"/uploads/cbt/images/{filename}"
    }


@router.post("/upload/audio")
async def upload_cbt_audio(
    file: UploadFile = File(...),
):
    ext = Path(file.filename).suffix.lower()
    filename = f"{uuid4().hex}{ext}"

    folder = UPLOAD_ROOT / "audio"
    folder.mkdir(parents=True, exist_ok=True)

    filepath = folder / filename

    with filepath.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "url": f"/uploads/cbt/audio/{filename}"
    }


@router.post("/upload/video")
async def upload_cbt_video(
    file: UploadFile = File(...),
):
    ext = Path(file.filename).suffix.lower()
    filename = f"{uuid4().hex}{ext}"

    folder = UPLOAD_ROOT / "videos"
    folder.mkdir(parents=True, exist_ok=True)

    filepath = folder / filename

    with filepath.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "url": f"/uploads/cbt/videos/{filename}"
    }

