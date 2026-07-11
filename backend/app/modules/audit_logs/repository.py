from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


class AuditLogRepository:

    def __init__(self, db: AsyncSession):
        self.db = db


    async def get_all(self):

        result = await self.db.execute(
            select(AuditLog).order_by(
                AuditLog.created_at.desc()
            )
        )

        return result.scalars().all()


    async def get_by_id(
        self,
        log_id: int,
    ):

        result = await self.db.execute(
            select(AuditLog).where(
                AuditLog.id == log_id
            )
        )

        return result.scalar_one_or_none()


    async def create(
        self,
        log: AuditLog,
    ):

        self.db.add(log)

        await self.db.commit()
        await self.db.refresh(log)

        return log
