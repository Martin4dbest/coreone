from fastapi import HTTPException, status

from app.modules.class_teachers.repository import (
    ClassTeacherRepository,
)


class ClassTeacherService:

    def __init__(
        self,
        db,
    ):
        self.repository = ClassTeacherRepository(db)


    async def assign_class_teacher(
        self,
        classroom_id: int,
        teacher_id: int,
        school_id: int,
    ):

        classroom = await self.repository.get_classroom(
            classroom_id,
            school_id,
        )

        if not classroom:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Classroom not found",
            )


        teacher = await self.repository.get_teacher(
            teacher_id,
            school_id,
        )

        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher not found",
            )


        classroom.class_teacher_id = teacher.id

        return await self.repository.save(
            classroom
        )


    async def remove_class_teacher(
        self,
        classroom_id: int,
        school_id: int,
    ):

        classroom = await self.repository.get_classroom(
            classroom_id,
            school_id,
        )

        if not classroom:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Classroom not found",
            )


        classroom.class_teacher_id = None

        return await self.repository.save(
            classroom
        )


    async def get_teacher_class(
        self,
        teacher_id: int,
        school_id: int,
    ):

        teacher = await self.repository.get_teacher(
            teacher_id,
            school_id,
        )

        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher not found",
            )


        classroom = await self.repository.get_teacher_class(
            teacher_id,
            school_id,
        )

        return classroom


    async def get_dashboard(
        self,
        current_user,
        term_id: int,
        session_id: int,
    ):

        teacher = await self.repository.get_teacher(
            current_user.id,
            current_user.school_id,
        )

        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher profile not found",
            )

        teacher_id = teacher.id
        school_id = current_user.school_id


        classroom = await self.repository.get_teacher_class(
            teacher_id,
            school_id,
        )

        if not classroom:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No class assigned",
            )


        assignments = await self.repository.get_class_subjects(
            classroom.id,
            school_id,
            session_id,
        )


        subjects = []

        submitted = 0


        for assignment in assignments:

            count = await self.repository.count_published_results(
                classroom.id,
                assignment.subject_id,
                term_id,
                session_id,
                school_id,
            )


            status_value = (
                "PUBLISHED"
                if count > 0
                else "PENDING"
            )


            if count > 0:
                submitted += 1


            subjects.append(
                {
                    "subject_id": assignment.subject_id,
                    "subject": assignment.subject.name,
                    "teacher": (
                        f"{assignment.teacher.first_name} "
                        f"{assignment.teacher.last_name}"
                    ),
                    "status": status_value,
                    "published_count": count,
                }
            )


        return {
            "classroom": {
                "id": classroom.id,
                "name": classroom.name,
            },
            "subjects": subjects,
            "submitted": submitted,
            "total": len(subjects),
        }