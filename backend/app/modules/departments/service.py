from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.department import Department
from app.modules.departments.repository import DepartmentRepository
from app.modules.departments.schemas import DepartmentCreateRequest


class DepartmentService:

    def __init__(self, db: AsyncSession):
        self.repository = DepartmentRepository(db)

    async def create_department(
        self,
        payload: DepartmentCreateRequest,
    ):
        department = Department(
            school_id=payload.school_id,
            name=payload.name,
            description=payload.description,
            is_active=True,
        )

        return await self.repository.create(department)

    async def get_departments(self):
        return await self.repository.get_all()

    async def get_department(self, department_id: int):
        department = await self.repository.get_by_id(
            department_id
        )

        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found",
            )

        return department
