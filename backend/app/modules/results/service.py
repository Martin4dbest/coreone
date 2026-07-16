from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.result import Result
from app.models.grading_system import GradingSystem

from app.modules.results.repository import ResultRepository
from app.modules.results.schemas import (
    ResultCreateRequest,
    ResultUpdateRequest,
)


class ResultService:

    def __init__(self, db: AsyncSession):
        self.repository = ResultRepository(db)

    async def create_result(
        self,
        payload: ResultCreateRequest,
        current_user,
    ):
        if (
            current_user.role.name != "SUPER_ADMIN"
            and payload.school_id != current_user.school_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot create results for another school",
            )

        if payload.ca_score < 0 or payload.ca_score > 40:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CA score must be between 0 and 40",
            )

        if payload.exam_score < 0 or payload.exam_score > 60:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Exam score must be between 0 and 60",
            )

        total_score = payload.ca_score + payload.exam_score

        grading = await self.get_grade_for_score(
            payload.school_id,
            total_score,
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
            grade=grading.grade if grading else None,
            remark=grading.remark if grading else None,
            is_active=True,
        )

        created = await self.repository.create(result)

        return await self.repository.get_by_id_with_details(
            created.id
        )

    async def get_results(
        self,
        current_user,
    ):
        school_id = None

        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

        return await self.repository.get_all(
            school_id
        )

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

    async def get_grade_for_score(
        self,
        school_id: int,
        score: float,
    ):
        result = await self.repository.db.execute(
            select(GradingSystem).where(
                GradingSystem.school_id == school_id,
                GradingSystem.minimum_score <= score,
                GradingSystem.maximum_score >= score,
            )
        )

        return result.scalar_one_or_none()
