from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.student import Student
from app.models.student_partner_school import StudentPartnerSchool
from app.models.cbt_attempt import CBTAttempt
from app.models.cbt_exam import CBTExam
from app.models.ebook_activity import EbookActivity
from app.models.ebook import Ebook
from app.models.browser_activity import BrowserActivity
from app.models.browser_link import BrowserLink
from app.models.youtube_activity import YoutubeActivity
from app.models.youtube_learning import YoutubeLearning


from app.core.permissions import require_roles
from app.db.database import get_db
from app.models.partner_school import PartnerSchool
from app.models.student import Student
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.partner_schools.schemas import (
    AssociateStudentsRequest,
    PartnerSchoolCreate,
    PartnerSchoolResponse,
    PartnerSchoolStudentResponse,
    PartnerSchoolUpdate,
)

router = APIRouter(
    prefix="/partner-schools",
    tags=["Partner Schools"],
)


async def require_partner_feature(
    db: AsyncSession,
    school_id: int,
):
    from app.models.school_feature import SchoolFeature

    result = await db.execute(
        select(SchoolFeature).where(
            SchoolFeature.school_id == school_id,
            SchoolFeature.feature_key == "partner_schools",
        )
    )

    feature = result.scalar_one_or_none()

    if not feature or not feature.enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Partner Schools feature is disabled for this school.",
        )


def verify_school_access(
    current_user: User,
    school_id: int,
):
    role_name = (
        current_user.role.name
        if current_user.role
        else None
    )

    if role_name == "SUPER_ADMIN":
        return

    if role_name == "SCHOOL_ADMIN":
        if current_user.school_id != school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot access another school.",
            )
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to manage Partner Schools.",
    )


@router.get(
    "/{school_id}",
    response_model=list[PartnerSchoolResponse],
)
async def list_partner_schools(
    school_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verify_school_access(current_user, school_id)
    await require_partner_feature(db, school_id)

    result = await db.execute(
        select(PartnerSchool)
        .where(PartnerSchool.school_id == school_id)
        .order_by(PartnerSchool.name.asc())
    )

    return list(result.scalars().all())


@router.post(
    "/{school_id}",
    response_model=PartnerSchoolResponse,
)
async def create_partner_school(
    school_id: int,
    payload: PartnerSchoolCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")
    ),
):
    verify_school_access(current_user, school_id)
    await require_partner_feature(db, school_id)

    name = payload.name.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Partner school name is required.",
        )

    result = await db.execute(
        select(PartnerSchool).where(
            PartnerSchool.school_id == school_id,
            PartnerSchool.name.ilike(name),
        )
    )

    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail="A partner school with this name already exists.",
        )

    partner_school = PartnerSchool(
        school_id=school_id,
        name=name,
        is_active=True,
    )

    db.add(partner_school)
    await db.commit()
    await db.refresh(partner_school)

    return partner_school


@router.patch(
    "/{school_id}/{partner_school_id}",
    response_model=PartnerSchoolResponse,
)
async def update_partner_school(
    school_id: int,
    partner_school_id: int,
    payload: PartnerSchoolUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")
    ),
):
    verify_school_access(current_user, school_id)
    await require_partner_feature(db, school_id)

    result = await db.execute(
        select(PartnerSchool).where(
            PartnerSchool.id == partner_school_id,
            PartnerSchool.school_id == school_id,
        )
    )

    partner_school = result.scalar_one_or_none()

    if not partner_school:
        raise HTTPException(
            status_code=404,
            detail="Partner school not found.",
        )

    if payload.name is not None:
        name = payload.name.strip()

        if not name:
            raise HTTPException(
                status_code=400,
                detail="Partner school name is required.",
            )

        partner_school.name = name

    if payload.is_active is not None:
        partner_school.is_active = payload.is_active

    await db.commit()
    await db.refresh(partner_school)

    return partner_school


@router.delete(
    "/{school_id}/{partner_school_id}",
)
async def delete_partner_school(
    school_id: int,
    partner_school_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")
    ),
):
    verify_school_access(current_user, school_id)
    await require_partner_feature(db, school_id)

    result = await db.execute(
        select(PartnerSchool).where(
            PartnerSchool.id == partner_school_id,
            PartnerSchool.school_id == school_id,
        )
    )

    partner_school = result.scalar_one_or_none()

    if not partner_school:
        raise HTTPException(
            status_code=404,
            detail="Partner school not found.",
        )

    await db.delete(partner_school)
    await db.commit()

    return {"message": "Partner school deleted successfully."}


@router.get(
    "/{school_id}/{partner_school_id}/students",
    response_model=list[PartnerSchoolStudentResponse],
)
async def get_associated_students(
    school_id: int,
    partner_school_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verify_school_access(current_user, school_id)
    await require_partner_feature(db, school_id)

    result = await db.execute(
        select(StudentPartnerSchool)
        .join(
            PartnerSchool,
            PartnerSchool.id
            == StudentPartnerSchool.partner_school_id,
        )
        .where(
            PartnerSchool.id == partner_school_id,
            PartnerSchool.school_id == school_id,
        )
    )

    return [
        PartnerSchoolStudentResponse(
            student_id=item.student_id,
            partner_school_id=item.partner_school_id,
        )
        for item in result.scalars().all()
    ]


@router.put(
    "/{school_id}/{partner_school_id}/students",
)
async def associate_students(
    school_id: int,
    partner_school_id: int,
    payload: AssociateStudentsRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")
    ),
):
    verify_school_access(current_user, school_id)
    await require_partner_feature(db, school_id)

    partner_result = await db.execute(
        select(PartnerSchool).where(
            PartnerSchool.id == partner_school_id,
            PartnerSchool.school_id == school_id,
        )
    )

    partner_school = partner_result.scalar_one_or_none()

    if not partner_school:
        raise HTTPException(
            status_code=404,
            detail="Partner school not found.",
        )

    if not partner_school.is_active:
        raise HTTPException(
            status_code=400,
            detail="This partner school is inactive.",
        )

    student_ids = list(dict.fromkeys(payload.student_ids))

    if not student_ids:
        return {
            "message": "No students selected.",
            "associated": 0,
        }

    students_result = await db.execute(
        select(Student).where(
            Student.id.in_(student_ids),
            Student.school_id == school_id,
        )
    )

    students = list(students_result.scalars().all())

    if len(students) != len(student_ids):
        raise HTTPException(
            status_code=400,
            detail="One or more students do not belong to this school.",
        )

    existing_result = await db.execute(
        select(StudentPartnerSchool.student_id).where(
            StudentPartnerSchool.partner_school_id
            == partner_school_id,
            StudentPartnerSchool.student_id.in_(student_ids),
        )
    )

    existing_ids = set(existing_result.scalars().all())

    for student_id in student_ids:
        if student_id in existing_ids:
            continue

        db.add(
            StudentPartnerSchool(
                student_id=student_id,
                partner_school_id=partner_school_id,
            )
        )

    await db.commit()

    return {
        "message": "Students associated successfully.",
        "associated": len(student_ids) - len(existing_ids),
    }


@router.delete(
    "/{school_id}/{partner_school_id}/students/{student_id}",
)
async def remove_student_association(
    school_id: int,
    partner_school_id: int,
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles("SUPER_ADMIN", "SCHOOL_ADMIN")
    ),
):
    verify_school_access(current_user, school_id)
    await require_partner_feature(db, school_id)

    await db.execute(
        delete(StudentPartnerSchool)
        .where(
            StudentPartnerSchool.student_id == student_id,
            StudentPartnerSchool.partner_school_id
            == partner_school_id,
        )
        .where(
            StudentPartnerSchool.student_id.in_(
                select(Student.id).where(
                    Student.school_id == school_id
                )
            )
        )
    )

    await db.commit()

    return {"message": "Student association removed."}


@router.get(
    "/student/{student_id}",
)
async def get_student_partner_schools(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    student_result = await db.execute(
        select(Student).where(Student.id == student_id)
    )

    student = student_result.scalar_one_or_none()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found.",
        )

    verify_school_access(current_user, student.school_id)
    await require_partner_feature(db, student.school_id)

    result = await db.execute(
        select(PartnerSchool)
        .join(
            StudentPartnerSchool,
            StudentPartnerSchool.partner_school_id
            == PartnerSchool.id,
        )
        .where(
            StudentPartnerSchool.student_id == student_id,
            PartnerSchool.school_id == student.school_id,
            PartnerSchool.is_active == True,
        )
        .order_by(PartnerSchool.name.asc())
    )

    return list(result.scalars().all())


# ============================================================
# PARTNER SCHOOL STUDENT DETAILS + LEARNING ACTIVITY
# ============================================================

@router.get(
    "/{school_id}/{partner_school_id}/students/{student_id}/details"
)
async def get_partner_student_details(
    school_id: int,
    partner_school_id: int,
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ---------------------------------------------------------
    # VERIFY PARTNER SCHOOL
    # ---------------------------------------------------------

    partner_school_result = await db.execute(
        select(PartnerSchool).where(
            PartnerSchool.id == partner_school_id,
            PartnerSchool.school_id == school_id,
        )
    )

    partner_school = (
        partner_school_result.scalar_one_or_none()
    )

    if partner_school is None:
        raise HTTPException(
            status_code=404,
            detail="Partner school not found",
        )

    # ---------------------------------------------------------
    # VERIFY STUDENT IS ASSOCIATED WITH THIS PARTNER SCHOOL
    # ---------------------------------------------------------

    link_result = await db.execute(
        select(StudentPartnerSchool).where(
            StudentPartnerSchool.student_id == student_id,
            StudentPartnerSchool.partner_school_id == partner_school_id,
        )
    )

    link = link_result.scalar_one_or_none()

    if link is None:
        raise HTTPException(
            status_code=404,
            detail="Student is not associated with this partner school",
        )

    # ---------------------------------------------------------
    # STUDENT
    # ---------------------------------------------------------

    student_result = await db.execute(
        select(Student)
        .options(
            selectinload(Student.user),
            selectinload(Student.classroom),
            selectinload(Student.school),
        )
        .where(
            Student.id == student_id,
            Student.school_id == school_id,
        )
    )

    student = student_result.scalar_one_or_none()

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found",
        )

    # ---------------------------------------------------------
    # CBT RESULTS
    # ---------------------------------------------------------

    cbt_result = await db.execute(
        select(CBTAttempt)
        .options(
            selectinload(CBTAttempt.exam).selectinload(
                CBTExam.subject
            ),
        )
        .where(
            CBTAttempt.student_id == student_id,
            CBTAttempt.completed.is_(True),
        )
        .order_by(
            CBTAttempt.submitted_at.desc()
        )
    )

    cbt_attempts = cbt_result.scalars().all()

    cbt_scores = []

    for attempt in cbt_attempts:
        exam = attempt.exam

        cbt_scores.append({
            "attempt_id": attempt.id,
            "exam_id": exam.id if exam else None,
            "exam_title": (
                exam.title
                if exam
                else "Unknown Exam"
            ),
            "subject": (
                exam.subject.name
                if exam and exam.subject
                else None
            ),
            "score": attempt.score,
            "total_marks": attempt.total_marks,
            "percentage": attempt.percentage,
            "passed": attempt.passed,
            "submitted_at": attempt.submitted_at,
        })

    # ---------------------------------------------------------
    # EBOOK ACTIVITY
    # ---------------------------------------------------------

    ebook_result = await db.execute(
        select(
            EbookActivity,
            Ebook.title.label("ebook_title"),
        )
        .join(
            Ebook,
            Ebook.id == EbookActivity.ebook_id,
        )
        .where(
            EbookActivity.user_id == student.user_id,
            EbookActivity.school_id == school_id,
        )
        .order_by(
            EbookActivity.created_at.desc()
        )
    )

    ebook_rows = ebook_result.all()

    ebook_activity = [
        {
            "id": activity.id,
            "ebook_id": activity.ebook_id,
            "ebook_title": ebook_title,
            "activity_type": activity.activity_type,
            "created_at": activity.created_at,
        }
        for activity, ebook_title in ebook_rows
    ]

    # ---------------------------------------------------------
    # BROWSER ACTIVITY
    # ---------------------------------------------------------

    browser_result = await db.execute(
        select(
            BrowserActivity,
            BrowserLink.title.label("resource_title"),
        )
        .join(
            BrowserLink,
            BrowserLink.id == BrowserActivity.browser_link_id,
        )
        .where(
            BrowserActivity.user_id == student.user_id,
            BrowserActivity.school_id == school_id,
        )
        .order_by(
            BrowserActivity.created_at.desc()
        )
    )

    browser_rows = browser_result.all()

    browser_activity = [
        {
            "id": activity.id,
            "browser_link_id": activity.browser_link_id,
            "resource_title": resource_title,
            "activity_type": activity.activity_type,
            "created_at": activity.created_at,
        }
        for activity, resource_title in browser_rows
    ]

    # ---------------------------------------------------------
    # YOUTUBE ACTIVITY
    # ---------------------------------------------------------

    youtube_result = await db.execute(
        select(
            YoutubeActivity,
            YoutubeLearning.title.label("video_title"),
        )
        .join(
            YoutubeLearning,
            YoutubeLearning.id == YoutubeActivity.youtube_learning_id,
        )
        .where(
            YoutubeActivity.user_id == student.user_id,
            YoutubeActivity.school_id == school_id,
        )
        .order_by(
            YoutubeActivity.created_at.desc()
        )
    )

    youtube_rows = youtube_result.all()

    youtube_activity = [
        {
            "id": activity.id,
            "youtube_learning_id": activity.youtube_learning_id,
            "video_title": video_title,
            "activity_type": activity.activity_type,
            "created_at": activity.created_at,
        }
        for activity, video_title in youtube_rows
    ]

    # ---------------------------------------------------------
    # RESPONSE
    # ---------------------------------------------------------

    return {
        "student": {
            "id": student.id,
            "user_id": student.user_id,
            "first_name": student.first_name,
            "middle_name": student.middle_name,
            "last_name": student.last_name,
            "admission_number": student.admission_number,
            "gender": student.gender,
            "date_of_birth": student.date_of_birth,
            "passport": student.passport,
            "classroom": (
                student.classroom.name
                if student.classroom
                else None
            ),
            "school_id": student.school_id,
            "partner_school_id": partner_school.id,
            "partner_school_name": partner_school.name,
        },

        "cbt_scores": cbt_scores,

        "ebook_activity": ebook_activity,

        "browser_activity": browser_activity,

        "youtube_activity": youtube_activity,
    }
