from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.academic_session import AcademicSession
from app.modules.academic_sessions.repository import AcademicSessionRepository
from app.modules.academic_sessions.schemas import AcademicSessionCreateRequest


class AcademicSessionService:

    def __init__(self, db: AsyncSession):
        self.repository = AcademicSessionRepository(db)

    async def create_session(
        self,
        payload: AcademicSessionCreateRequest,
    ):
        session = AcademicSession(
            school_id=payload.school_id,
            name=payload.name,
            is_current=payload.is_current,
        )

        return await self.repository.create(session)

    async def get_sessions(
        self,
        school_id: int | None = None,
    ):
        return await self.repository.get_all(
            school_id
        )

    async def get_session(
        self,
        session_id: int,
    ):
        session = await self.repository.get_by_id(session_id)

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Academic session not found",
            )

        return session

    async def make_current(
        self,
        session_id: int,
    ):
        session = await self.get_session(session_id)

        return await self.repository.make_current(
            session
        )
