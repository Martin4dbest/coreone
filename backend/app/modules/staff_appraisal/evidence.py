from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.cbt_attempt import CBTAttempt
from app.models.cbt_exam import CBTExam
from app.models.result import Result
from app.models.staff import Staff
from app.models.staff_attendance import StaffAttendance
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.teacher_subject import TeacherSubject
from app.modules.staff_appraisal.router import (
    ensure_feature,
    get_current_user,
    resolve_reviewer_school,
    role_name,
)

router = APIRouter()


def suggested_rating(value: float | None) -> int | None:
    """Return a provisional 1–5 rating from a verified percentage."""
    if value is None:
        return None
    if value < 50:
        return 1
    if value < 60:
        return 2
    if value < 70:
        return 3
    if value < 80:
        return 4
    return 5


@router.get("/evidence/{staff_id}")
async def get_staff_appraisal_evidence(
    staff_id: int,
    period_start: date = Query(...),
    period_end: date = Query(...),
    school_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Collect school-scoped evidence for a staff appraisal review."""

    if role_name(current_user) not in {
        "SUPER_ADMIN",
        "SCHOOL_ADMIN",
        "PRINCIPAL",
    }:
        raise HTTPException(
            status_code=403,
            detail="Reviewer access required.",
        )

    if period_end < period_start:
        raise HTTPException(
            status_code=422,
            detail="Review period end must be on or after its start.",
        )

    resolved_school_id = await resolve_reviewer_school(
        current_user,
        school_id,
    )
    await ensure_feature(db, resolved_school_id)

    staff_result = await db.execute(
        select(Staff).where(
            Staff.id == staff_id,
            Staff.user.has(school_id=resolved_school_id),
        )
    )
    staff = staff_result.scalars().first()

    if staff is None:
        raise HTTPException(
            status_code=404,
            detail="Staff member not found in this school.",
        )

    teacher_result = await db.execute(
        select(Teacher).where(
            Teacher.user_id == staff.user_id,
            Teacher.school_id == resolved_school_id,
        )
    )
    teacher = teacher_result.scalars().first()

    if teacher is None:
        raise HTTPException(
            status_code=422,
            detail="Staff member has no linked teacher profile.",
        )

    assignment_result = await db.execute(
        select(TeacherSubject).where(
            TeacherSubject.school_id == resolved_school_id,
            TeacherSubject.teacher_id == teacher.id,
            TeacherSubject.is_active.is_(True),
        )
    )
    assignments = assignment_result.scalars().all()

    assignment_keys = {
        (
            assignment.classroom_id,
            assignment.subject_id,
            assignment.academic_session_id,
        )
        for assignment in assignments
    }
    class_subject_keys = {
        (assignment.classroom_id, assignment.subject_id)
        for assignment in assignments
    }

    start_dt = datetime.combine(period_start, time.min)
    end_dt = datetime.combine(
        period_end + timedelta(days=1),
        time.min,
    )

    # Results have publication timestamps, but academic terms and
    # sessions have no start/end dates. Publication date is therefore
    # a proxy, not proof of when the underlying teaching took place.
    result_query = await db.execute(
        select(Result).where(
            Result.school_id == resolved_school_id,
            Result.is_published.is_(True),
            Result.published_at >= start_dt,
            Result.published_at < end_dt,
        )
    )

    matched_results = [
        result
        for result in result_query.scalars().all()
        if (
            result.class_id,
            result.subject_id,
            result.academic_session_id,
        ) in assignment_keys
    ]

    result_scores = [
        float(result.total_score)
        for result in matched_results
        if result.total_score is not None
    ]

    average_result = (
        round(sum(result_scores) / len(result_scores), 2)
        if result_scores
        else None
    )

    # CBT outcomes are matched to assigned class/subject combinations.
    # The creator breakdown is reported separately so outcomes from
    # exams created by other staff are not misrepresented as teacher-
    # created assessments.
    cbt_query = await db.execute(
        select(CBTAttempt, CBTExam, Student)
        .join(
            CBTExam,
            CBTAttempt.exam_id == CBTExam.id,
        )
        .join(
            Student,
            CBTAttempt.student_id == Student.id,
        )
        .where(
            CBTExam.school_id == resolved_school_id,
            Student.school_id == resolved_school_id,
            CBTAttempt.completed.is_(True),
            CBTAttempt.submitted_at.is_not(None),
            CBTAttempt.submitted_at >= start_dt,
            CBTAttempt.submitted_at < end_dt,
        )
    )

    matched_attempts = [
        (attempt, exam)
        for attempt, exam, student in cbt_query.all()
        if (
            (exam.class_id, exam.subject_id) in class_subject_keys
            and student.classroom_id == exam.class_id
        )
    ]

    teacher_created_attempts = [
        (attempt, exam)
        for attempt, exam in matched_attempts
        if exam.created_by == staff.user_id
    ]
    other_created_attempts = [
        (attempt, exam)
        for attempt, exam in matched_attempts
        if exam.created_by != staff.user_id
    ]

    cbt_scores = [
        float(attempt.percentage)
        for attempt, _ in matched_attempts
        if attempt.percentage is not None
    ]
    teacher_created_cbt_scores = [
        float(attempt.percentage)
        for attempt, _ in teacher_created_attempts
        if attempt.percentage is not None
    ]

    average_cbt = (
        round(sum(cbt_scores) / len(cbt_scores), 2)
        if cbt_scores
        else None
    )
    average_teacher_created_cbt = (
        round(
            sum(teacher_created_cbt_scores)
            / len(teacher_created_cbt_scores),
            2,
        )
        if teacher_created_cbt_scores
        else None
    )

    attendance_query = await db.execute(
        select(StaffAttendance).where(
            StaffAttendance.school_id == resolved_school_id,
            StaffAttendance.staff_id == staff.id,
            StaffAttendance.attendance_date >= period_start,
            StaffAttendance.attendance_date <= period_end,
        )
    )
    attendance_rows = attendance_query.scalars().all()

    attendance_counts = {
        "present": 0,
        "late": 0,
        "absent": 0,
        "excused": 0,
        "other": 0,
    }

    for attendance in attendance_rows:
        attendance_status = str(
            attendance.status or ""
        ).strip().lower()

        key = (
            attendance_status
            if attendance_status in attendance_counts
            else "other"
        )
        attendance_counts[key] += 1

    counted_days = (
        attendance_counts["present"]
        + attendance_counts["late"]
        + attendance_counts["absent"]
    )

    attendance_percentage = (
        round(
            attendance_counts["present"] / counted_days * 100,
            2,
        )
        if counted_days
        else None
    )

    evidence = {
        "subject_performance": {
            "available": bool(result_scores),
            "published_result_count": len(matched_results),
            "scored_result_count": len(result_scores),
            "average_total_score": average_result,
            "source": (
                "Published student results matched to the teacher's "
                "active class, subject and academic-session assignments."
            ),
            "limitation": (
                "Result scores use the school's 100-point CA/exam scale. "
                "The review period filters by publication timestamp because "
                "the academic term and session models have no date fields. "
                "Publication date does not prove when teaching occurred."
            ),
        },
        "cbt_assessment": {
            "available": bool(cbt_scores),
            "completed_attempt_count": len(matched_attempts),
            "scored_attempt_count": len(cbt_scores),
            "average_percentage": average_cbt,
            "passed_attempt_count": sum(
                1
                for attempt, _ in matched_attempts
                if attempt.passed
            ),
            "teacher_created_exam_attempt_count": len(
                teacher_created_attempts
            ),
            "other_created_exam_attempt_count": len(
                other_created_attempts
            ),
            "teacher_created_exam_average_percentage": (
                average_teacher_created_cbt
            ),
            "source": (
                "Completed CBT attempts submitted during the review period, "
                "matched to the teacher's active class and subject assignments. "
                "Exam creator counts are reported separately."
            ),
            "limitation": (
                "The overall average measures assigned-class and subject "
                "outcomes; it does not prove the teacher created or personally "
                "administered every exam. The creator breakdown uses the "
                "recorded exam creator user ID. Only completed attempts with "
                "a submission timestamp are included."
            ),
        },
        "attendance_punctuality": {
            "available": bool(attendance_rows),
            "record_count": len(attendance_rows),
            "status_counts": attendance_counts,
            "recorded_present_percentage": attendance_percentage,
            "source": (
                "Recorded staff attendance entries for the review dates."
            ),
            "limitation": (
                "Unrecorded days are not assumed absent. The percentage uses "
                "recorded present, late and absent statuses. Check-in times "
                "are not independently classified as late."
            ),
        },
        "classroom_professionalism": {
            "available": False,
            "source": (
                "No structured classroom observation records are evaluated "
                "by this endpoint."
            ),
            "limitation": (
                "Requires documented observations from an authorized reviewer. "
                "No automatic rating is generated without that evidence."
            ),
        },
        "improvement_development": {
            "available": False,
            "source": (
                "No verified development-target progress is evaluated "
                "by this endpoint."
            ),
            "limitation": (
                "Requires recorded development targets and evidence of progress. "
                "No automatic rating is generated without that evidence."
            ),
        },
    }

    return {
        "staff_id": staff.id,
        "teacher_id": teacher.id,
        "school_id": resolved_school_id,
        "review_period": {
            "start": period_start.isoformat(),
            "end": period_end.isoformat(),
        },
        "assignments": [
            {
                "classroom_id": assignment.classroom_id,
                "subject_id": assignment.subject_id,
                "academic_session_id": assignment.academic_session_id,
            }
            for assignment in assignments
        ],
        "evidence": evidence,
        "suggested_ratings": {
            "subject_performance": suggested_rating(average_result),
            "cbt_assessment": suggested_rating(average_cbt),
            "attendance_punctuality": suggested_rating(
                attendance_percentage
            ),
        },
        "rating_rubric": {
            "1": "0–49%",
            "2": "50–59%",
            "3": "60–69%",
            "4": "70–79%",
            "5": "80–100%",
        },
        "scoring_note": (
            "Percentage bands are provisional defaults, not a verified "
            "school-approved policy. Reviewers must verify the evidence and "
            "rubric before approval. Unavailable categories receive no "
            "automatic rating. The weighted appraisal score normalizes across "
            "categories that have ratings."
        ),
    }
