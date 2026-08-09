from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.models.user import User
from app.models.student import Student
from app.models.browser_activity import BrowserActivity
from app.models.browser_link import BrowserLink
from app.modules.auth.dependencies.current_user import get_current_user

router = APIRouter(
    prefix="/browser-links",
    tags=["Internal Browser Activity"],
)


def student_name(student, user):
    if student:
        name = " ".join(
            part
            for part in [
                getattr(student, "first_name", None),
                getattr(student, "middle_name", None),
                getattr(student, "last_name", None),
            ]
            if part
        )
        if name:
            return name

    return (
        getattr(user, "full_name", None)
        or getattr(user, "name", None)
        or getattr(user, "email", None)
        or f"User #{user.id}"
    )


@router.post("/{link_id}/activity")
async def record_browser_activity(
    link_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(BrowserLink).where(
            BrowserLink.id == link_id,
            BrowserLink.school_id == current_user.school_id,
            BrowserLink.is_active.is_(True),
        )
    )

    link = result.scalar_one_or_none()

    if not link:
        raise HTTPException(
            status_code=404,
            detail="Browser resource not found",
        )

    activity = BrowserActivity(
        browser_link_id=link.id,
        user_id=current_user.id,
        school_id=current_user.school_id,
        activity_type="view",
    )

    db.add(activity)
    await db.commit()

    return {"message": "Browser activity recorded"}


@router.get("/activity")
async def browser_activity(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(
            BrowserActivity,
            BrowserLink,
            User,
            Student,
        )
        .join(
            BrowserLink,
            BrowserLink.id == BrowserActivity.browser_link_id,
        )
        .join(
            User,
            User.id == BrowserActivity.user_id,
        )
        .outerjoin(
            Student,
            Student.user_id == User.id,
        )
        .options(
            selectinload(Student.classroom),
        )
        .where(
            BrowserActivity.school_id == current_user.school_id,
        )
        .order_by(
            BrowserActivity.created_at.desc()
        )
    )

    result = await db.execute(query)

    rows = result.all()

    return [
        {
            "id": activity.id,
            "browser_link_id": link.id,
            "resource_title": link.title,
            "student_id": user.id,
            "student_name": student_name(student, user),
            "class_name": (
                student.classroom.name
                if student and student.classroom
                else None
            ),
            "email": getattr(user, "email", None),
            "activity_type": activity.activity_type,
            "created_at": activity.created_at,
        }
        for activity, link, user, student in rows
    ]


@router.get("/activity/summary")
async def browser_activity_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_result = await db.execute(
        select(func.count(BrowserActivity.id)).where(
            BrowserActivity.school_id == current_user.school_id
        )
    )

    total_clicks = total_result.scalar() or 0

    students_result = await db.execute(
        select(
            func.count(
                func.distinct(BrowserActivity.user_id)
            )
        ).where(
            BrowserActivity.school_id == current_user.school_id
        )
    )

    total_students = students_result.scalar() or 0

    resources_result = await db.execute(
        select(
            BrowserLink.title,
            func.count(BrowserActivity.id).label("views"),
        )
        .join(
            BrowserActivity,
            BrowserActivity.browser_link_id == BrowserLink.id,
        )
        .where(
            BrowserActivity.school_id == current_user.school_id
        )
        .group_by(BrowserLink.id, BrowserLink.title)
        .order_by(
            func.count(BrowserActivity.id).desc()
        )
        .limit(10)
    )

    most_viewed = [
        {
            "title": title,
            "views": views,
        }
        for title, views in resources_result.all()
    ]

    return {
        "total_clicks": total_clicks,
        "total_students": total_students,
        "most_viewed": most_viewed,
    }
