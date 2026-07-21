from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.classroom import Classroom
from app.models.level import Level
from app.models.teacher import Teacher
from app.models.teacher_subject import TeacherSubject
from app.models.subject import Subject

from app.modules.classes.repository import ClassRepository
from app.modules.classes.schemas import ClassCreateRequest


class ClassService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = ClassRepository(db)


    async def create_class(
        self,
        payload: ClassCreateRequest,
        current_user,
    ):
        school_id = payload.school_id

        if current_user.role.name != "SUPER_ADMIN":
            if school_id != current_user.school_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You cannot create classes for another school",
                )

        result = await self.db.execute(
            select(Level).where(
                Level.id == payload.level_id,
                Level.school_id == school_id,
            )
        )

        level = result.scalar_one_or_none()

        if not level:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected level does not belong to this school",
            )

        existing = await self.db.execute(
            select(Classroom).where(
                Classroom.school_id == school_id,
                Classroom.level_id == payload.level_id,
                Classroom.name == payload.name,
            )
        )

        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This class already exists for this level",
            )

        classroom = Classroom(
            school_id=school_id,
            level_id=payload.level_id,
            name=payload.name,
        )

        return await self.repository.create(classroom)


    async def get_classes(
        self,
        current_user,
        school_id: int | None = None,
    ):
        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

        return await self.repository.get_all(
            school_id
        )


    async def get_class(
        self,
        class_id: int,
        current_user,
    ):
        school_id = None

        if current_user.role.name != "SUPER_ADMIN":
            school_id = current_user.school_id

        classroom = await self.repository.get_by_id(
            class_id,
            school_id,
        )

        if not classroom:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class not found",
            )

        return classroom


    async def activate_class(
        self,
        class_id: int,
        current_user,
    ):
        classroom = await self.repository.get_by_id(
            class_id,
            current_user.school_id
            if current_user.role.name != "SUPER_ADMIN"
            else None,
        )

        if not classroom:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class not found",
            )

        classroom.is_active = True

        return await self.repository.update(classroom)


    async def deactivate_class(
        self,
        class_id: int,
        current_user,
    ):
        classroom = await self.repository.get_by_id(
            class_id,
            current_user.school_id
            if current_user.role.name != "SUPER_ADMIN"
            else None,
        )

        if not classroom:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class not found",
            )

        classroom.is_active = False

        return await self.repository.update(classroom)


    async def delete_class(
        self,
        class_id: int,
        current_user,
    ):
        classroom = await self.get_class(
            class_id,
            current_user,
        )

        await self.repository.delete(classroom)

        return {
            "message": "Class deleted successfully"
        }




    async def assign_class_teacher(
        self,
        class_id: int,
        teacher_id: int,
        current_user,
    ):
        classroom = await self.get_class(
            class_id,
            current_user,
        )

        result = await self.db.execute(
            select(Teacher)
            .options(selectinload(Teacher.user))
            .where(Teacher.id == teacher_id)
        )

        teacher = result.scalar_one_or_none()

        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher not found",
            )

        if not teacher.user or teacher.user.school_id != classroom.school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Teacher does not belong to this school",
            )

        classroom.class_teacher_id = teacher.id
        classroom.class_teacher_assigned_by = current_user.id

        from datetime import datetime

        classroom.class_teacher_assigned_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(classroom)

        return classroom

    async def get_class_teachers(
        self,
        class_id: int,
        current_user,
    ):
    
        classroom = await self.get_class(
            class_id,
            current_user,
        )
    
    
        result = await self.db.execute(
            select(
                TeacherSubject,
                Subject.name,
                Teacher.first_name,
                Teacher.last_name,
            )
            .join(
                Subject,
                Subject.id == TeacherSubject.subject_id,
            )
            .join(
                Teacher,
                Teacher.id == TeacherSubject.teacher_id,
            )
            .where(
                TeacherSubject.classroom_id == class_id,
                TeacherSubject.school_id == classroom.school_id,
                TeacherSubject.is_active == True,
            )
        )
    
    
        subject_teachers = []
    
        for row in result.all():
    
            assignment = row[0]
    
            subject_teachers.append(
                {
                    "subject_id": assignment.subject_id,
                    "teacher_id": assignment.teacher_id,
                    "subject_name": row[1],
                    "teacher_name": f"{row[2]} {row[3]}",
                }
            )
    
    
        return {
            "class_teacher": classroom.class_teacher,
            "subject_teachers": subject_teachers,
        }
    
