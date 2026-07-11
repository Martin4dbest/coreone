from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.modules.audit_logs.repository import AuditLogRepository
from app.modules.audit_logs.schemas import AuditLogCreateRequest


class AuditLogService:

    def __init__(self, db: AsyncSession):
        self.repository = AuditLogRepository(db)


    async def create_log(
        self,
        payload: AuditLogCreateRequest,
    ):

        log = AuditLog(
            school_id=payload.school_id,
            user_id=payload.user_id,
            action=payload.action,
            entity=payload.entity,
            entity_id=payload.entity_id,
            description=payload.description,
        )

        return await self.repository.create(
            log
        )


    async def get_logs(self):
        return await self.repository.get_all()


    async def get_log(
        self,
        log_id: int,
    ):

        log = await self.repository.get_by_id(
            log_id
        )

        if not log:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Audit log not found",
            )

        return log
