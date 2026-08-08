from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.department import Department


class DepartmentRepository:

    def __init__(self, db: AsyncSession):
        self.db = db


    async def get_all(
        self,
        school_id: int | None = None,
    ):
        query = select(Department).order_by(
            Department.name
        )

        if school_id is not None:
            query = query.where(
                Department.school_id == school_id
            )

        result = await self.db.execute(query)

        return result.scalars().all()


    async def get_by_id(
        self,
        department_id: int,
        school_id: int | None = None,
    ):
        query = select(Department).where(
            Department.id == department_id
        )

        if school_id is not None:
            query = query.where(
                Department.school_id == school_id
            )

        result = await self.db.execute(query)

        return result.scalar_one_or_none()


    async def create(
        self,
        department: Department,
    ):
        self.db.add(department)

        await self.db.commit()
        await self.db.refresh(department)

        return department


    async def delete(
        self,
        department: Department,
    ):
        await self.db.delete(department)
        await self.db.commit()