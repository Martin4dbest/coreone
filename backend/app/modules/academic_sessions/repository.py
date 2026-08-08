from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.academic_session import AcademicSession


class AcademicSessionRepository:

    def __init__(
        self,
        db: AsyncSession
    ):
        self.db = db


    async def get_all(
        self,
        school_id: int | None = None,
    ):

        query = select(AcademicSession)


        if school_id is not None:
            query = query.where(
                AcademicSession.school_id == school_id
            )


        query = query.order_by(
            AcademicSession.id.desc()
        )


        result = await self.db.execute(query)

        return result.scalars().all()



    async def get_by_id(
        self,
        session_id: int,
        school_id: int | None = None,
    ):

        query = select(AcademicSession).where(
            AcademicSession.id == session_id
        )


        if school_id is not None:
            query = query.where(
                AcademicSession.school_id == school_id
            )


        result = await self.db.execute(query)

        return result.scalar_one_or_none()



    async def create(
        self,
        session: AcademicSession,
    ):

        if session.is_current:

            await self.db.execute(
                update(AcademicSession)
                .where(
                    AcademicSession.school_id == session.school_id
                )
                .values(
                    is_current=False
                )
            )


        self.db.add(session)

        await self.db.commit()

        await self.db.refresh(session)

        return session



    async def make_current(
        self,
        session: AcademicSession,
    ):

        await self.db.execute(
            update(AcademicSession)
            .where(
                AcademicSession.school_id == session.school_id
            )
            .values(
                is_current=False
            )
        )


        session.is_current = True


        await self.db.commit()

        await self.db.refresh(session)


        return session