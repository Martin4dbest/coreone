from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.teacher_subject import TeacherSubject
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.classroom import Classroom

from app.modules.teachers.dashboard_schemas import (
    TeacherDashboardResponse,
    TeacherClassResponse,
)


class TeacherDashboardService:


    def __init__(
        self,
        db: AsyncSession,
    ):
        self.db = db


    async def get_my_students(
        self,
        current_user,
        class_id=None,
    ):

        if current_user.role.name != "TEACHER":
            raise HTTPException(
                status_code=403,
                detail="Teacher access only",
            )


        teacher = current_user.teacher


        if not teacher:
            raise HTTPException(
                status_code=403,
                detail="Teacher profile missing",
            )


        assignments_result = await self.db.execute(
            select(TeacherSubject.classroom_id)
            .where(
                TeacherSubject.teacher_id == teacher.id,
                TeacherSubject.school_id == current_user.school_id,
                TeacherSubject.is_active == True,
            )
        )


        classroom_ids = [
            item[0]
            for item in assignments_result.all()
        ]


        if class_id:
            classroom_ids = [
                classroom_id
                for classroom_id in classroom_ids
                if classroom_id == class_id
            ]


        if not classroom_ids:
            return []


        students_result = await self.db.execute(
            select(Student)
            .options(
                selectinload(Student.classroom)
            )
            .where(
                Student.classroom_id.in_(classroom_ids),
                Student.school_id == current_user.school_id,
            )
        )


        students = students_result.scalars().unique().all()


        return [
            {
                "id": student.id,
                "admission_number": student.admission_number,
                "first_name": student.first_name,
                "middle_name": student.middle_name,
                "last_name": student.last_name,
                "gender": student.gender,
                "date_of_birth": str(student.date_of_birth),
                "classroom_name": (
                    student.classroom.name
                    if student.classroom
                    else "-"
                ),
            }
            for student in students
        ]


    async def get_dashboard(
        self,
        current_user,
    ):

        if current_user.role.name != "TEACHER":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Teacher access only",
            )


        teacher = current_user.teacher


        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Teacher profile missing",
            )


        result = await self.db.execute(

            select(
                TeacherSubject
            )
            .options(
                selectinload(
                    TeacherSubject.classroom
                ),
                selectinload(
                    TeacherSubject.subject
                ),
            )
            .where(
                TeacherSubject.teacher_id == teacher.id,
                TeacherSubject.school_id == current_user.school_id,
                TeacherSubject.is_active == True,
            )

        )


        assignments = result.scalars().unique().all()


        classes = []


        for assignment in assignments:


            count_result = await self.db.execute(
                select(
                    func.count(Student.id)
                )
                .where(
                    Student.classroom_id == assignment.classroom_id,
                    Student.school_id == current_user.school_id,
                )
            )


            student_count = count_result.scalar_one()


            classes.append(
                TeacherClassResponse(
                    classroom_id=assignment.classroom_id,
                    classroom_name=assignment.classroom.name,
                    subject_id=assignment.subject_id,
                    subject_name=assignment.subject.name,
                    student_count=student_count,
                )
            )


        return TeacherDashboardResponse(

            teacher_id=teacher.id,

            teacher_name=(
                f"{teacher.first_name} "
                f"{teacher.last_name}"
            ),

            total_classes=len(
                {
                    item.classroom_id
                    for item in classes
                }
            ),

            total_subjects=len(classes),

            classes=classes,
        )