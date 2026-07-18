from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

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
        self.db = db


    async def get_grade_for_score(
        self,
        school_id: int,
        score: float,
    ):
        result = await self.db.execute(
            select(GradingSystem).where(
                GradingSystem.school_id == school_id,
                GradingSystem.minimum_score <= score,
                GradingSystem.maximum_score >= score,
            )
        )

        return result.scalar_one_or_none()


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
                status_code=403,
                detail="Unauthorized school access",
            )

        total = payload.ca_score + payload.exam_score

        grading = await self.get_grade_for_score(
            payload.school_id,
            total,
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
            total_score=total,
            grade=grading.grade if grading else payload.grade,
            remark=grading.remark if grading else payload.remark,
            is_active=True,
        )

        return await self.repository.create(result)


    async def update_result(
        self,
        result_id: int,
        payload: ResultUpdateRequest,
        current_user,
    ):
        result = await self.repository.get_by_id(result_id)

        if not result:
            raise HTTPException(
                status_code=404,
                detail="Result not found",
            )

        result.ca_score = payload.ca_score
        result.exam_score = payload.exam_score
        result.total_score = payload.ca_score + payload.exam_score
        result.grade = payload.grade
        result.remark = payload.remark

        return await self.repository.update(result)


    async def get_results(self, current_user):
        school_id = None

        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

        return await self.repository.get_all(
            school_id
        )


    async def get_result(self, result_id: int):
        result = await self.repository.get_by_id(result_id)

        if not result:
            raise HTTPException(
                status_code=404,
                detail="Result not found",
            )

        return result


    async def delete_result(
        self,
        result_id: int,
        current_user,
    ):
        result = await self.repository.get_by_id(result_id)

        if not result:
            raise HTTPException(
                status_code=404,
                detail="Result not found",
            )

        await self.repository.delete(result)

        return {
            "message": "Result deleted successfully"
        }


    async def delete_all_results(
        self,
        current_user,
    ):
        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id
        else:
            raise HTTPException(
                status_code=400,
                detail="Specify school deletion through admin tools",
            )

        await self.repository.delete_all(
            school_id
        )

        return {
            "message": "All results deleted"
        }


    async def create_bulk_results(
        self,
        payload: BulkResultEntryRequest,
        current_user,
    ):
        created = []

        for item in payload.results:

            total = item.ca_score + item.exam_score

            grading = await self.get_grade_for_score(
                payload.school_id,
                total,
            )

            existing = await self.repository.get_existing_result(
                payload.school_id,
                item.student_id,
                payload.class_id,
                payload.subject_id,
                payload.term_id,
                payload.academic_session_id,
            )

            if existing:
                existing.ca_score = item.ca_score
                existing.exam_score = item.exam_score
                existing.total_score = total
                existing.grade = grading.grade if grading else None
                existing.remark = grading.remark if grading else None

                created.append(
                    await self.repository.update(existing)
                )

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
                    total_score=total,
                    grade=grading.grade if grading else None,
                    remark=grading.remark if grading else None,
                    is_active=True,
                )

                created.append(
                    await self.repository.create(result)
                )

        return created
