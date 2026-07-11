from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.result import Result
from app.modules.results.repository import ResultRepository
from app.modules.results.schemas import ResultCreateRequest


class ResultService:

    def __init__(self, db: AsyncSession):
        self.repository = ResultRepository(db)

    async def create_result(
        self,
        payload: ResultCreateRequest,
    ):
        total_score = (
            payload.ca_score +
            payload.exam_score
        )

        result = Result(
            school_id=payload.school_id,
            student_id=payload.student_id,
            class_id=payload.class_id,
            subject_id=payload.subject_id,
            term_id=payload.term_id,
            academic_session_id=payload.academic_session_id,
            ca_score=payload.ca_score,
            exam_score=payload.exam_score,
            total_score=total_score,
            grade=payload.grade,
            remark=payload.remark,
            is_active=True,
        )

        return await self.repository.create(result)

    async def get_results(self):
        return await self.repository.get_all()

    async def get_result(
        self,
        result_id: int,
    ):
        result = await self.repository.get_by_id(
            result_id
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Result not found",
            )

        return result
