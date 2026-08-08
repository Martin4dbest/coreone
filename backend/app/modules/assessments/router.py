from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.assessments.schemas import (
    AssessmentCreateRequest,
    AssessmentResponse,
)
from app.modules.assessments.service import AssessmentService


router = APIRouter(
    prefix="/assessments",
    tags=["Assessments"],
)


@router.post(
    "",
    response_model=AssessmentResponse,
)
async def create_assessment(
    payload: AssessmentCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await AssessmentService(db).create_assessment(
        payload
    )


@router.get(
    "",
    response_model=list[AssessmentResponse],
)
async def get_assessments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await AssessmentService(db).get_assessments()


@router.get(
    "/{assessment_id}",
    response_model=AssessmentResponse,
)
async def get_assessment(
    assessment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await AssessmentService(db).get_assessment(
        assessment_id
    )