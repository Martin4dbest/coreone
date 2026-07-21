from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.classroom import Classroom
from app.models.parent import Parent
from app.models.school import School
from app.models.staff import Staff
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.teacher_subject import TeacherSubject
from app.models.user import User
from app.models.visitor import Visitor


class DashboardService:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def _count(self, model) -> int:
        result = await self.db.execute(
            select(func.count(model.id))
        )
        return result.scalar_one()

    async def _count_by_school(self, model, school_id: int) -> int:
        result = await self.db.execute(
            select(func.count(model.id)).where(
                model.school_id == school_id
            )
        )
        return result.scalar_one()

    async def _count_user_profile_by_school(
        self,
        model,
        school_id: int,
    ) -> int:
        result = await self.db.execute(
            select(func.count(model.id))
            .join(User, model.user_id == User.id)
            .where(User.school_id == school_id)
        )
        return result.scalar_one()

    async def get_dashboard(self, current_user: User):
        role_name = current_user.role.name

        if role_name == "SUPER_ADMIN":
            return await self.get_super_admin_dashboard()

        if role_name == "SCHOOL_ADMIN":
            return await self.get_school_admin_dashboard(
                current_user.school_id
            )

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Dashboard is not available for this role yet",
        )

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

    async def get_school_admin_dashboard(
        self,
        school_id: int,
    ):
        return {
            "total_schools": 1,
            "total_students": await self._count_by_school(
                Student,
                school_id,
            ),
            "total_teachers": await self._count_user_profile_by_school(
                Teacher,
                school_id,
            ),
            "total_parents": await self._count_user_profile_by_school(
                Parent,
                school_id,
            ),
            "total_staff": await self._count_user_profile_by_school(
                Staff,
                school_id,
            ),
            "total_classes": await self._count_by_school(
                Classroom,
                school_id,
            ),
            "total_visitors": await self._count_by_school(
                Visitor,
                school_id,
            ),
        }


    async def get_teacher_dashboard(
        self,
        current_user: User,
    ):

        if not current_user.teacher:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Teacher profile not found.",
            )

        teacher_id = current_user.teacher.id


        assigned_subjects = await self.db.execute(
            select(func.count(TeacherSubject.id))
            .where(
                TeacherSubject.teacher_id == teacher_id,
                TeacherSubject.is_active == True,
            )
        )


        assigned_classes = await self.db.execute(
            select(
                func.count(
                    func.distinct(
                        TeacherSubject.classroom_id
                    )
                )
            )
            .where(
                TeacherSubject.teacher_id == teacher_id,
                TeacherSubject.is_active == True,
            )
        )


        return {
            "total_schools": 1,
            "total_students": 0,
            "total_teachers": 1,
            "total_parents": 0,
            "total_staff": 0,
            "total_classes": assigned_classes.scalar_one(),
            "total_visitors": 0,

            "assigned_subjects": assigned_subjects.scalar_one(),
        }

