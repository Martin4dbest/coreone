from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.classroom import Classroom
from app.models.teacher_subject import TeacherSubject


async def get_teacher_id(current_user):

    if not current_user.teacher:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not linked to a teacher profile.",
        )

    return current_user.teacher.id



async def check_teacher_class_access(
    db: AsyncSession,
    current_user,
    classroom_id: int,
):

    role = current_user.role.name


    # -------------------------
    # SUPER ADMIN
    # -------------------------

    if role == "SUPER_ADMIN":
        return True


    # -------------------------
    # SCHOOL ADMIN
    # -------------------------

    if role == "SCHOOL_ADMIN":

        classroom = await db.get(
            Classroom,
            classroom_id,
        )

        if not classroom:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Class not found.",
            )


        if classroom.school_id != current_user.school_id:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Class belongs to another school.",
            )

        return True



    # -------------------------
    # TEACHER
    # -------------------------

    if role == "TEACHER":

        teacher_id = await get_teacher_id(
            current_user
        )


        # Class teacher access

        result = await db.execute(
            select(Classroom)
            .where(
                Classroom.id == classroom_id,
                Classroom.class_teacher_id == teacher_id,
            )
        )


        if result.scalar_one_or_none():

            return True



        # Subject teacher access

        result = await db.execute(
            select(TeacherSubject)
            .where(
                TeacherSubject.classroom_id == classroom_id,
                TeacherSubject.teacher_id == teacher_id,
                TeacherSubject.is_active == True,
            )
        )


        if result.scalar_one_or_none():

            return True



        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not assigned to this class.",
        )



    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Role not permitted.",
    )