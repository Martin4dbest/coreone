from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.academic_session import AcademicSession


class AcademicSessionRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(
            select(AcademicSession)
        )
        return result.scalars().all()

    async def get_by_id(self, session_id: int):
        result = await self.db.execute(
            select(AcademicSession).where(
                AcademicSession.id == session_id
            )
        )
        return result.scalar_one_or_none()

    async def create(self, session: AcademicSession):
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        return session
