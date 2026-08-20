from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user

from app.modules.class_teachers.repository import (
    ClassTeacherRepository,
)

from app.modules.class_teachers.service import (
    ClassTeacherService,
)


router = APIRouter(
    prefix="/class-teachers",
    tags=["Class Teachers"],
)



@router.get(
    "/broadsheet",
    status_code=status.HTTP_200_OK,
)
async def class_teacher_broadsheet(
    term_id: int,
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    CLASS TEACHER BROADSHEET

    Returns the complete academic broadsheet for the class assigned
    to the logged-in teacher.

    Access:
    - TEACHER only
    - teacher must be assigned as Classroom.class_teacher_id

    Subject-teacher permissions are NOT changed.
    """

    from sqlalchemy import select
    from app.models.teacher import Teacher
    from app.models.classroom import Classroom
    from app.models.student import Student
    from app.models.subject import Subject
    from app.models.result import Result
    from app.models.academic_session import AcademicSession
    from app.models.term import Term

    role_name = (
        getattr(
            getattr(current_user, "role", None),
            "name",
            None,
        )
        or getattr(current_user, "role", None)
        or ""
    )
    role_name = str(role_name).upper()

    if role_name != "TEACHER":
        raise HTTPException(
            status_code=403,
            detail="Teacher access only.",
        )

    teacher_result = await db.execute(
        select(Teacher).where(
            Teacher.user_id == current_user.id,
            Teacher.school_id == current_user.school_id,
        )
    )

    teacher = teacher_result.scalar_one_or_none()

    if not teacher:
        raise HTTPException(
            status_code=403,
            detail="Teacher profile not found.",
        )

    classroom_result = await db.execute(
        select(Classroom).where(
            Classroom.class_teacher_id == teacher.id,
            Classroom.school_id == current_user.school_id,
            Classroom.is_active == True,
        )
    )

    classroom = classroom_result.scalar_one_or_none()

    if not classroom:
        raise HTTPException(
            status_code=404,
            detail="You are not assigned as a class teacher.",
        )

    term_result = await db.execute(
        select(Term).where(
            Term.id == term_id,
            Term.school_id == current_user.school_id,
        )
    )
    term = term_result.scalar_one_or_none()

    if not term:
        raise HTTPException(
            status_code=404,
            detail="Selected term not found.",
        )

    session_result = await db.execute(
        select(AcademicSession).where(
            AcademicSession.id == session_id,
            AcademicSession.school_id == current_user.school_id,
        )
    )
    session = session_result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Selected academic session not found.",
        )

    students_result = await db.execute(
        select(Student).where(
            Student.school_id == current_user.school_id,
            Student.classroom_id == classroom.id,
        ).order_by(
            Student.first_name.asc(),
            Student.last_name.asc(),
        )
    )

    students = students_result.scalars().all()

    # All subjects officially offered by this class for the
    # selected academic session must appear in the broadsheet,
    # even when some teachers have not entered scores yet.
    from app.models.teacher_subject import TeacherSubject

    assignment_result = await db.execute(
        select(
            TeacherSubject.subject_id,
            Subject.name,
        )
        .join(
            Subject,
            Subject.id == TeacherSubject.subject_id,
        )
        .where(
            TeacherSubject.classroom_id == classroom.id,
            TeacherSubject.school_id == current_user.school_id,
            TeacherSubject.academic_session_id == session_id,
            TeacherSubject.is_active == True,
        )
        .order_by(
            Subject.name.asc(),
        )
    )

    subject_ids = []
    seen_subjects = set()

    for subject_id, subject_name in assignment_result.all():
        if subject_id in seen_subjects:
            continue

        seen_subjects.add(subject_id)

        subject_ids.append({
            "id": subject_id,
            "name": subject_name or "Unknown",
        })

    results_result = await db.execute(
        select(
            Result,
            Subject.name.label("subject_name"),
        )
        .join(
            Subject,
            Subject.id == Result.subject_id,
        )
        .where(
            Result.school_id == current_user.school_id,
            Result.class_id == classroom.id,
            Result.term_id == term_id,
            Result.academic_session_id == session_id,
            Result.is_active == True,
        )
    )

    result_rows = results_result.all()

    result_map = {}

    for result, subject_name in result_rows:
        result_map[
            (result.student_id, result.subject_id)
        ] = {
            "ca": result.ca_score,
            "exam": result.exam_score,
            "total": result.total_score,
            "grade": result.grade,
            "remark": result.remark,
        }

    return {
        "classroom": {
            "id": classroom.id,
            "name": classroom.name,
            "student_count": len(students),
        },
        "term": {
            "id": term.id,
            "name": term.name,
        },
        "session": {
            "id": session.id,
            "name": session.name,
        },
        "subjects": subject_ids,
        "students": [
            {
                "id": student.id,
                "admission_number": student.admission_number,
                "name": (
                    f"{student.first_name} "
                    f"{(student.middle_name + ' ') if student.middle_name else ''}"
                    f"{student.last_name}"
                ).strip(),
                "results": {
                    str(subject["id"]): result_map.get(
                        (student.id, subject["id"])
                    )
                    for subject in subject_ids
                },
            }
            for student in students
        ],
    }


@router.get(
    "/dashboard",
    status_code=status.HTTP_200_OK,
)
async def class_teacher_dashboard(
    term_id: int,
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    repository = ClassTeacherRepository(db)

    service = ClassTeacherService(
        repository
    )

    return await service.get_dashboard(
        current_user,
        term_id,
        session_id,
    )