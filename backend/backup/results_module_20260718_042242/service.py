from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.result import Result
from app.models.grading_system import GradingSystem

from app.modules.results.repository import ResultRepository
from app.modules.results.schemas import (
    ResultCreateRequest,
    ResultUpdateRequest,
    BulkResultEntryRequest,
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

        existing = await self.repository.get_existing_result(
            school_id=payload.school_id,
            student_id=item.student_id,
            class_id=payload.class_id,
            subject_id=payload.subject_id,
            term_id=payload.term_id,
            academic_session_id=payload.academic_session_id,
        )

        if existing:
            existing.ca_score = item.ca_score
            existing.exam_score = item.exam_score
            existing.total_score = total_score
            existing.grade = grading.grade if grading else None
            existing.remark = grading.remark if grading else None

            updated = await self.repository.update(existing)
            created_results.append(updated)

        else:
            result = Result(
                school_id=payload.school_id,
                student_id=item.student_id,
                class_id=payload.class_id,
                subject_id=payload.subject_id,
                term_id=payload.term_id,
                academic_session_id=payload.academic_session_id,
                ca_score=item.ca_score,
                exam_score=item.exam_score,
                total_score=total_score,
                grade=grading.grade if grading else None,
                remark=grading.remark if grading else None,
                is_active=True,
            )

            created = await self.repository.create(result)
            created_results.append(created)

        return created_results

    async def delete_result(
        self,
        result_id: int,
        current_user,
    ):
        result = await self.repository.get_by_id(result_id)

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Result not found",
            )

        if (
            current_user.role.name != "SUPER_ADMIN"
            and result.school_id != current_user.school_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot delete another school's result",
            )

        await self.repository.delete(result)

        return {
            "message": "Result deleted successfully"
        }


    