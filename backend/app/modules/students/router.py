from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    Form,
)
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.student import Student
from app.models.cbt_attempt import CBTAttempt
from app.models.cbt_exam import CBTExam
from app.models.ebook_activity import EbookActivity
from app.models.ebook import Ebook
from app.models.browser_activity import BrowserActivity
from app.models.browser_link import BrowserLink
from app.models.youtube_activity import YoutubeActivity
from app.models.youtube_learning import YoutubeLearning

from app.core.permissions import require_roles
from app.core.tenant.context import TenantContext
from app.core.tenant.dependencies import get_tenant_from_request
from app.db.database import get_db
from app.models.user import User

from app.modules.students.schemas import (
    StudentCreateRequest,
)
from app.modules.students.service import StudentService

router = APIRouter(
    prefix="/students",
    tags=["Students"],
)


@router.post("/")
async def create_student(
    payload: StudentCreateRequest,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        )
    ),
):
    return await StudentService(db).create_student(
        payload,
        tenant,
        current_user,
    )


@router.post("/import")
async def import_students(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        )
    ),
):
    return await StudentService(db).import_students(
        tenant.school_id,
        file,
        current_user,
    )


@router.get("/")
async def get_students(
    class_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
            "TEACHER",
        )
    ),
):
    return await StudentService(db).get_students(
        tenant,
        current_user,
        class_id,
    )




# ============================================================
# STUDENT ACTIVITY
# ============================================================
# General student activity endpoint.
#
# IMPORTANT:
# This endpoint does NOT require a partner-school association.
# It is intentionally separate from the partner-school activity
# endpoint.
# ============================================================

@router.get("/{student_id}/activity")
async def get_student_activity(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
            "TEACHER",
        )
    ),
):
    school_id = tenant.school_id

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
        from fastapi import HTTPException

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

    cbt_scores = []

    for attempt in cbt_result.scalars().all():
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

    ebook_activity = [
        {
            "id": activity.id,
            "ebook_id": activity.ebook_id,
            "ebook_title": ebook_title,
            "activity_type": activity.activity_type,
            "created_at": activity.created_at,
        }
        for activity, ebook_title in ebook_result.all()
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

    browser_activity = [
        {
            "id": activity.id,
            "browser_link_id": activity.browser_link_id,
            "resource_title": resource_title,
            "activity_type": activity.activity_type,
            "created_at": activity.created_at,
        }
        for activity, resource_title in browser_result.all()
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

    youtube_activity = [
        {
            "id": activity.id,
            "youtube_learning_id": activity.youtube_learning_id,
            "video_title": video_title,
            "activity_type": activity.activity_type,
            "created_at": activity.created_at,
        }
        for activity, video_title in youtube_result.all()
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
        },
        "cbt_scores": cbt_scores,
        "ebook_activity": ebook_activity,
        "browser_activity": browser_activity,
        "youtube_activity": youtube_activity,
    }


@router.get("/{student_id}")
async def get_student(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
            "TEACHER",
        )
    ),
):
    return await StudentService(db).get_student(
        student_id,
        tenant,
        current_user,
    )


@router.patch("/{student_id}/activate")
async def activate_student(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        )
    ),
):
    return await StudentService(db).activate_student(
        student_id,
        tenant,
        current_user,
    )


@router.patch("/{student_id}/deactivate")
async def deactivate_student(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        )
    ),
):
    return await StudentService(db).deactivate_student(
        student_id,
        tenant,
        current_user,
    )


@router.post("/{student_id}/passport")
async def upload_passport(
    student_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        )
    ),
):
    return await StudentService(db).upload_passport(
        student_id,
        tenant,
        file,
        current_user,
    )


@router.delete("/{student_id}", status_code=204)
async def delete_student(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    tenant: TenantContext = Depends(get_tenant_from_request),
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "SCHOOL_ADMIN",
        )
    ),
):
    await StudentService(db).delete_student(
        student_id,
        tenant,
        current_user,
    )