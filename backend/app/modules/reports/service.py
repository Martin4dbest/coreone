from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.student import Student
from app.models.teacher import Teacher
from app.models.classroom import Classroom
from app.models.attendance import Attendance
from app.models.visitor import Visitor


class ReportsService:

    def __init__(self, db: AsyncSession):
        self.db = db


    async def get_reports(self):

        students = await self.db.execute(
            select(func.count(Student.id))
        )

        teachers = await self.db.execute(
            select(func.count(Teacher.id))
        )

        classes = await self.db.execute(
            select(func.count(Classroom.id))
        )

        attendance = await self.db.execute(
            select(func.count(Attendance.id))
        )

        visitors = await self.db.execute(
            select(func.count(Visitor.id))
        )


        return {
            "total_students": students.scalar(),
            "total_teachers": teachers.scalar(),
            "total_classes": classes.scalar(),
            "total_attendance_records": attendance.scalar(),
            "total_visitors": visitors.scalar(),
        }
