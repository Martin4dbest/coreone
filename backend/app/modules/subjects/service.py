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
        current_user,
    ):
        if (
            current_user.role.name != "SUPER_ADMIN"
            and payload.school_id != current_user.school_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot create subjects for another school",
            )

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
        current_user,
    ):
        school_id = None

        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

        return await self.repository.get_all(
            school_id
        )


    async def get_subject(
        self,
        subject_id: int,
        current_user,
    ):
        school_id = None

        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

        subject = await self.repository.get_by_id(
            subject_id,
            school_id,
        )

        if not subject:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subject not found",
            )

        return subject
