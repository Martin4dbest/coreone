from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assessment import Assessment
from app.modules.assessments.repository import AssessmentRepository
from app.modules.assessments.schemas import AssessmentCreateRequest


class AssessmentService:

    def __init__(self, db: AsyncSession):
        self.repository = AssessmentRepository(db)

    async def create_assessment(
        self,
        payload: AssessmentCreateRequest,
    ):
        assessment = Assessment(
            school_id=payload.school_id,
            title=payload.title,
            description=payload.description,
            assessment_type=payload.assessment_type,
            class_id=payload.class_id,
            teacher_id=payload.teacher_id,
            due_date=payload.due_date,
            is_published=False,
            is_active=True,
        )

        return await self.repository.create(
            assessment
        )

    async def get_assessments(self):
        return await self.repository.get_all()

    async def get_assessment(
        self,
        assessment_id: int,
    ):
        assessment = await self.repository.get_by_id(
            assessment_id
        )

        if not assessment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assessment not found",
            )

        return assessment