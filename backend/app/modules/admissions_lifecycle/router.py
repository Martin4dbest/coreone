from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.school_access import check_school_access
from app.db.database import get_db
from app.models.academic_session import AcademicSession
from app.models.classroom import Classroom
from app.models.student import Student
from app.models.student_lifecycle_history import StudentLifecycleHistory
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.school_features.service import SchoolFeatureService


router = APIRouter(
    prefix="/admissions-lifecycle/schools/{school_id}",
    tags=["Admissions & Student Lifecycle"],
)

AllowedStatus = Literal["ACTIVE", "ARCHIVED", "GRADUATED", "TRANSFERRED", "WITHDRAWN"]


class PromotionRequest(BaseModel):
    student_ids: list[int] = Field(min_length=1, max_length=500)
    target_classroom_id: int
    target_session_id: int
    notes: str | None = Field(default=None, max_length=2000)


class StatusRequest(BaseModel):
    new_status: AllowedStatus
    notes: str | None = Field(default=None, max_length=2000)


async def _authorize(
    school_id: int,
    db: AsyncSession,
    user: User,
):
    if user.role.name not in {"SUPER_ADMIN", "SCHOOL_ADMIN"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins and School Admins can manage student lifecycle.",
        )

    check_school_access(user, school_id)

    features = await SchoolFeatureService(db).list_features(school_id)
    enabled = any(
        item.feature_key == "admissions_lifecycle" and item.enabled is True
        for item in features
    )
    if not enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admissions & Student Lifecycle is not enabled for this school.",
        )


async def _get_student(
    db: AsyncSession,
    school_id: int,
    student_id: int,
) -> Student:
    result = await db.execute(
        select(Student).where(
            Student.id == student_id,
            Student.school_id == school_id,
        )
    )
    student = result.scalar_one_or_none()
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found in this school.")
    return student


@router.get("/options")
async def get_options(
    school_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await _authorize(school_id, db, user)

    class_result = await db.execute(
        select(Classroom).where(
            Classroom.school_id == school_id,
            Classroom.is_active.is_(True),
        ).order_by(Classroom.name)
    )
    session_result = await db.execute(
        select(AcademicSession).where(
            AcademicSession.school_id == school_id,
        ).order_by(AcademicSession.name.desc())
    )

    return {
        "classes": [
            {"id": item.id, "name": item.name, "level_id": item.level_id}
            for item in class_result.scalars().all()
        ],
        "sessions": [
            {"id": item.id, "name": item.name, "is_current": item.is_current}
            for item in session_result.scalars().all()
        ],
    }


@router.get("/students")
async def list_students(
    school_id: int,
    include_archived: bool = False,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await _authorize(school_id, db, user)

    query = (
        select(Student, Classroom.name, AcademicSession.name)
        .outerjoin(
            Classroom,
            (Classroom.id == Student.classroom_id)
            & (Classroom.school_id == school_id),
        )
        .outerjoin(
            AcademicSession,
            (AcademicSession.id == Student.current_academic_session_id)
            & (AcademicSession.school_id == school_id),
        )
        .where(Student.school_id == school_id)
    )
    if not include_archived:
        query = query.where(Student.lifecycle_status != "ARCHIVED")

    result = await db.execute(query.order_by(Student.last_name, Student.first_name))
    rows = result.all()

    return [
        {
            "id": student.id,
            "user_id": student.user_id,
            "school_id": student.school_id,
            "classroom_id": student.classroom_id,
            "class_name": class_name,
            "current_academic_session_id": student.current_academic_session_id,
            "session_name": session_name,
            "admission_number": student.admission_number,
            "first_name": student.first_name,
            "middle_name": student.middle_name,
            "last_name": student.last_name,
            "gender": student.gender,
            "date_of_birth": (
                student.date_of_birth.isoformat()
                if student.date_of_birth else None
            ),
            "lifecycle_status": student.lifecycle_status or "ACTIVE",
        }
        for student, class_name, session_name in rows
    ]


@router.post("/promotions/preview")
async def preview_promotion(
    school_id: int,
    payload: PromotionRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await _authorize(school_id, db, user)

    if len(set(payload.student_ids)) != len(payload.student_ids):
        raise HTTPException(status_code=422, detail="Duplicate student IDs are not allowed.")

    target_class = await db.scalar(
        select(Classroom).where(
            Classroom.id == payload.target_classroom_id,
            Classroom.school_id == school_id,
            Classroom.is_active.is_(True),
        )
    )
    target_session = await db.scalar(
        select(AcademicSession).where(
            AcademicSession.id == payload.target_session_id,
            AcademicSession.school_id == school_id,
        )
    )
    if target_class is None or target_session is None:
        raise HTTPException(
            status_code=422,
            detail="The destination class and session must belong to the selected school.",
        )

    result = await db.execute(
        select(Student, Classroom.name, AcademicSession.name)
        .outerjoin(
            Classroom,
            (Classroom.id == Student.classroom_id)
            & (Classroom.school_id == school_id),
        )
        .outerjoin(
            AcademicSession,
            (AcademicSession.id == Student.current_academic_session_id)
            & (AcademicSession.school_id == school_id),
        )
        .where(
            Student.school_id == school_id,
            Student.id.in_(payload.student_ids),
        )
    )
    rows = result.all()
    if len(rows) != len(payload.student_ids):
        raise HTTPException(status_code=422, detail="One or more students do not belong to this school.")

    blocked = [
        student.id for student, _, _ in rows
        if (student.lifecycle_status or "ACTIVE") != "ACTIVE"
    ]
    if blocked:
        raise HTTPException(
            status_code=409,
            detail=f"Only ACTIVE students can be promoted. Blocked student IDs: {blocked}",
        )

    return {
        "student_count": len(rows),
        "destination_class": target_class.name,
        "destination_session": target_session.name,
        "students": [
            {
                "id": student.id,
                "name": " ".join(
                    part for part in [
                        student.first_name, student.middle_name, student.last_name
                    ] if part
                ),
                "admission_number": student.admission_number,
                "previous_class": class_name,
                "previous_session": session_name,
            }
            for student, class_name, session_name in rows
        ],
        "notes": payload.notes,
        "confirmation_required": True,
    }


@router.post("/promotions/confirm")
async def confirm_promotion(
    school_id: int,
    payload: PromotionRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Revalidate all IDs and destinations at confirmation time.
    await _authorize(school_id, db, user)

    if len(set(payload.student_ids)) != len(payload.student_ids):
        raise HTTPException(status_code=422, detail="Duplicate student IDs are not allowed.")

    target_class = await db.scalar(
        select(Classroom).where(
            Classroom.id == payload.target_classroom_id,
            Classroom.school_id == school_id,
            Classroom.is_active.is_(True),
        )
    )
    target_session = await db.scalar(
        select(AcademicSession).where(
            AcademicSession.id == payload.target_session_id,
            AcademicSession.school_id == school_id,
        )
    )
    if target_class is None or target_session is None:
        raise HTTPException(status_code=422, detail="Invalid destination class or session.")

    result = await db.execute(
        select(Student).where(
            Student.school_id == school_id,
            Student.id.in_(payload.student_ids),
        ).with_for_update()
    )
    students = result.scalars().all()
    if len(students) != len(payload.student_ids):
        raise HTTPException(status_code=422, detail="One or more students do not belong to this school.")

    if any((item.lifecycle_status or "ACTIVE") != "ACTIVE" for item in students):
        raise HTTPException(status_code=409, detail="Only ACTIVE students can be promoted.")

    try:
        for student in students:
            db.add(
                StudentLifecycleHistory(
                    school_id=school_id,
                    student_id=student.id,
                    action="PROMOTED",
                    previous_classroom_id=student.classroom_id,
                    new_classroom_id=target_class.id,
                    previous_session_id=student.current_academic_session_id,
                    new_session_id=target_session.id,
                    previous_status=student.lifecycle_status or "ACTIVE",
                    new_status="ACTIVE",
                    performed_by=user.id,
                    notes=payload.notes,
                )
            )
            student.classroom_id = target_class.id
            student.current_academic_session_id = target_session.id

        await db.commit()
    except Exception:
        await db.rollback()
        raise

    return {"updated": len(students), "message": "Promotion completed and history recorded."}


@router.patch("/students/{student_id}/status")
async def change_student_status(
    school_id: int,
    student_id: int,
    payload: StatusRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await _authorize(school_id, db, user)
    student = await _get_student(db, school_id, student_id)
    previous = student.lifecycle_status or "ACTIVE"

    if previous == payload.new_status:
        return {"message": "Student already has this status.", "status": previous}

    if previous != "ACTIVE" and payload.new_status != "ACTIVE":
        raise HTTPException(
            status_code=409,
            detail="Restore the student to ACTIVE before applying another status.",
        )

    action = {
        "ARCHIVED": "ARCHIVED",
        "GRADUATED": "GRADUATED",
        "TRANSFERRED": "TRANSFERRED",
        "WITHDRAWN": "WITHDRAWN",
        "ACTIVE": "RESTORED",
    }[payload.new_status]

    try:
        db.add(
            StudentLifecycleHistory(
                school_id=school_id,
                student_id=student.id,
                action=action,
                previous_classroom_id=student.classroom_id,
                new_classroom_id=student.classroom_id,
                previous_session_id=student.current_academic_session_id,
                new_session_id=student.current_academic_session_id,
                previous_status=previous,
                new_status=payload.new_status,
                performed_by=user.id,
                notes=payload.notes,
            )
        )
        student.lifecycle_status = payload.new_status
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    return {"message": "Student status updated and history recorded.", "status": payload.new_status}


@router.get("/students/{student_id}/history")
async def get_student_history(
    school_id: int,
    student_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await _authorize(school_id, db, user)
    await _get_student(db, school_id, student_id)

    result = await db.execute(
        select(StudentLifecycleHistory)
        .where(
            StudentLifecycleHistory.school_id == school_id,
            StudentLifecycleHistory.student_id == student_id,
        )
        .order_by(StudentLifecycleHistory.created_at.desc(), StudentLifecycleHistory.id.desc())
    )
    return [
        {
            "id": item.id,
            "action": item.action,
            "previous_classroom_id": item.previous_classroom_id,
            "new_classroom_id": item.new_classroom_id,
            "previous_session_id": item.previous_session_id,
            "new_session_id": item.new_session_id,
            "previous_status": item.previous_status,
            "new_status": item.new_status,
            "performed_by": item.performed_by,
            "notes": item.notes,
            "created_at": item.created_at.isoformat() if item.created_at else None,
        }
        for item in result.scalars().all()
    ]
