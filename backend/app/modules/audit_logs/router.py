from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.audit_logs.schemas import (
    AuditLogCreateRequest,
    AuditLogResponse,
)
from app.modules.audit_logs.service import AuditLogService


router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"],
)


@router.post(
    "",
    response_model=AuditLogResponse,
)
async def create_audit_log(
    payload: AuditLogCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await AuditLogService(db).create_log(
        payload
    )


@router.get(
    "",
    response_model=list[AuditLogResponse],
)
async def get_audit_logs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await AuditLogService(db).get_logs()


@router.get(
    "/{log_id}",
    response_model=AuditLogResponse,
)
async def get_audit_log(
    log_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await AuditLogService(db).get_log(
        log_id
    )
