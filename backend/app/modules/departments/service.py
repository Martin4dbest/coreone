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
        current_user,
    ):
        if (
            current_user.role.name != "SUPER_ADMIN"
            and payload.school_id != current_user.school_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot create departments for another school",
            )

        department = Department(
            school_id=(
                payload.school_id
                if current_user.role.name == "SUPER_ADMIN"
                else current_user.school_id
            ),
            name=payload.name,
            description=payload.description,
            is_active=True,
        )

        return await self.repository.create(department)


    async def get_departments(
        self,
        current_user,
        school_id: int | None = None,
    ):

        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

        return await self.repository.get_all(
            school_id
        )


    async def get_department(
        self,
        department_id: int,
        current_user,
    ):
        school_id = None

        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

        department = await self.repository.get_by_id(
            department_id,
            school_id,
        )

        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found",
            )

        return department


    async def delete_department(
        self,
        department_id: int,
        current_user,
    ):
        school_id = None

        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

        department = await self.repository.get_by_id(
            department_id,
            school_id,
        )

        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found",
            )

        await self.repository.delete(department)

        return {
            "message": "Department deleted successfully."
        }