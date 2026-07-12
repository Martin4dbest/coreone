from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.subject import Subject
from app.modules.subjects.repository import SubjectRepository
from app.modules.subjects.schemas import SubjectCreateRequest


class SubjectService:

    def __init__(self, db: AsyncSession):
        self.repository = SubjectRepository(db)

    async def create_subject(
        self,
        payload: SubjectCreateRequest,
    ):
        subject = Subject(
            school_id=payload.school_id,
            department_id=payload.department_id,
            name=payload.name,
            code=payload.code,
            is_active=True,
        )

        return await self.repository.create(subject)

    async def get_subjects(
        self,
        school_id: int | None = None,
    ):
        return await self.repository.get_all(
            school_id
        )

    async def get_subject(self, subject_id: int):
        subject = await self.repository.get_by_id(subject_id)

        if not subject:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subject not found",
            )

        return subject
