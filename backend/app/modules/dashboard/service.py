from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.school import School
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.parent import Parent
from app.models.staff import Staff
from app.models.classroom import Classroom
from app.models.visitor import Visitor


class DashboardService:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def _count(self, model) -> int:
        result = await self.db.execute(
            select(func.count(model.id))
        )

        return result.scalar_one()

    async def get_super_admin_dashboard(self):
        return {
            "total_schools": await self._count(School),
            "total_students": await self._count(Student),
            "total_teachers": await self._count(Teacher),
            "total_parents": await self._count(Parent),
            "total_staff": await self._count(Staff),
            "total_classes": await self._count(Classroom),
            "total_visitors": await self._count(Visitor),
        }
