from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    Form,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_roles
from app.core.tenant.context import TenantContext
from app.core.tenant.dependencies import get_tenant_from_request
from app.db.database import get_db
from app.models.user import User

from app.modules.students.schemas import (
    StudentCreateRequest,
)
from app.modules.students.service import StudentService

router = APIRouter(
    prefix="/students",
    tags=["Students"],
)


@router.post("/")
async def create_student(
    payload: StudentCreateRequest,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        )
    ),
):
    return await StudentService(db).create_student(
        payload,
        tenant,
        current_user,
    )


@router.post("/import")
async def import_students(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        )
    ),
):
    return await StudentService(db).import_students(
        tenant.school_id,
        file,
        current_user,
    )


@router.get("/")
async def get_students(
    class_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
            "TEACHER",
        )
    ),
):
    return await StudentService(db).get_students(
        tenant,
        current_user,
        class_id,
    )


@router.get("/{student_id}")
async def get_student(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
            "TEACHER",
        )
    ),
):
    return await StudentService(db).get_student(
        student_id,
        tenant,
        current_user,
    )


@router.patch("/{student_id}/activate")
async def activate_student(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        )
    ),
):
    return await StudentService(db).activate_student(
        student_id,
        tenant,
        current_user,
    )


@router.patch("/{student_id}/deactivate")
async def deactivate_student(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        )
    ),
):
    return await StudentService(db).deactivate_student(
        student_id,
        tenant,
        current_user,
    )


@router.post("/{student_id}/passport")
async def upload_passport(
    student_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        )
    ),
):
    return await StudentService(db).upload_passport(
        student_id,
        tenant,
        file,
        current_user,
    )


@router.delete("/{student_id}", status_code=204)
async def delete_student(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        )
    ),
):
    await StudentService(db).delete_student(
        student_id,
        tenant,
        current_user,
    )
