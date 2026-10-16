from __future__ import annotations

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.school_access import check_school_access
from app.db.database import get_db
from app.models.exam_paper import ExamPaper, ExamPaperReview
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user

router = APIRouter(tags=["Standalone Exam Builder"])

ADMIN_ROLES = {"SUPER_ADMIN", "SCHOOL_ADMIN"}
REVIEWER_ROLES = {"SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"}
EDIT_ROLES = {"SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"}


def _role(user: User) -> str:
    return (user.role.name if user.role and user.role.name else "").strip().upper()


def _school_id(user: User, requested: int | None) -> int:
    if _role(user) == "SUPER_ADMIN":
        if requested is None:
            raise HTTPException(400, "school_id is required for Super Admin.")
        target = requested
    else:
        target = user.school_id
        if requested is not None and requested != target:
            raise HTTPException(403, "You can only access your school's exam papers.")

    check_school_access(user, target)
    return target


def _marks(sections: list) -> int:
    total = 0
    for section in sections:
        if not isinstance(section, dict):
            continue
        questions = section.get("questions", [])
        if isinstance(questions, list):
            for question in questions:
                if isinstance(question, dict):
                    try:
                        total += max(0, int(question.get("marks", 0)))
                    except (TypeError, ValueError):
                        pass
    return total


def _serialize(paper: ExamPaper) -> dict:
    return {
        "id": paper.id,
        "school_id": paper.school_id,
        "title": paper.title,
        "subject": paper.subject,
        "class_name": paper.class_name,
        "instructions": paper.instructions,
        "sections": paper.sections,
        "total_marks": paper.total_marks,
        "status": paper.status,
        "created_by": paper.created_by,
        "created_at": paper.created_at.isoformat() if paper.created_at else None,
        "updated_at": paper.updated_at.isoformat() if paper.updated_at else None,
    }


def _editable(paper: ExamPaper, user: User) -> None:
    if _role(user) not in EDIT_ROLES:
        raise HTTPException(403, "You are not permitted to edit exam papers.")
    if _role(user) not in ADMIN_ROLES and paper.created_by != user.id:
        raise HTTPException(403, "You can only edit exam papers you created.")
    if paper.status not in {"DRAFT", "REJECTED"}:
        raise HTTPException(409, "Only draft or rejected papers can be edited.")


@router.get("/exam-builder")
async def list_exam_papers(
    school_id: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    target = _school_id(user, school_id)
    result = await db.execute(
        select(ExamPaper)
        .where(ExamPaper.school_id == target)
        .order_by(ExamPaper.updated_at.desc())
    )
    return [_serialize(item) for item in result.scalars().all()]


@router.post("/exam-builder")
async def create_exam_paper(
    payload: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if _role(user) not in EDIT_ROLES:
        raise HTTPException(403, "You are not permitted to create exam papers.")

    target = _school_id(user, payload.get("school_id"))
    title = str(payload.get("title", "")).strip()
    subject = str(payload.get("subject", "")).strip()
    class_name = str(payload.get("class_name", "")).strip()
    sections = payload.get("sections", [])

    if not title or not subject or not class_name:
        raise HTTPException(400, "Title, subject and class are required.")
    if not isinstance(sections, list):
        raise HTTPException(400, "Sections must be a list.")

    paper = ExamPaper(
        school_id=target,
        title=title[:200],
        subject=subject[:150],
        class_name=class_name[:100],
        instructions=payload.get("instructions"),
        sections=sections,
        total_marks=_marks(sections),
        status="DRAFT",
        created_by=user.id,
    )
    db.add(paper)
    await db.commit()
    await db.refresh(paper)
    return _serialize(paper)


@router.get("/exam-builder/{paper_id}")
async def get_exam_paper(
    paper_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ExamPaper).where(ExamPaper.id == paper_id)
    )
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(404, "Exam paper not found.")

    check_school_access(user, paper.school_id)
    if _role(user) not in ADMIN_ROLES and paper.created_by != user.id:
        raise HTTPException(403, "You can only view exam papers you created.")

    return _serialize(paper)


@router.put("/exam-builder/{paper_id}")
async def update_exam_paper(
    paper_id: int,
    payload: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ExamPaper).where(ExamPaper.id == paper_id)
    )
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(404, "Exam paper not found.")

    check_school_access(user, paper.school_id)
    _editable(paper, user)

    for field, limit in (
        ("title", 200),
        ("subject", 150),
        ("class_name", 100),
    ):
        if field in payload:
            value = str(payload[field]).strip()
            if not value:
                raise HTTPException(400, f"{field} cannot be empty.")
            setattr(paper, field, value[:limit])

    if "instructions" in payload:
        paper.instructions = payload["instructions"]

    if "sections" in payload:
        if not isinstance(payload["sections"], list):
            raise HTTPException(400, "Sections must be a list.")
        paper.sections = payload["sections"]
        paper.total_marks = _marks(paper.sections)

    await db.commit()
    await db.refresh(paper)
    return _serialize(paper)


@router.post("/exam-builder/{paper_id}/submit")
async def submit_exam_paper(
    paper_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ExamPaper).where(ExamPaper.id == paper_id)
    )
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(404, "Exam paper not found.")

    check_school_access(user, paper.school_id)
    _editable(paper, user)

    if not paper.sections:
        raise HTTPException(400, "Add at least one section before submitting.")
    if paper.total_marks <= 0:
        raise HTTPException(400, "The paper must have marks greater than zero.")

    paper.status = "PENDING_APPROVAL"
    await db.commit()
    await db.refresh(paper)
    return _serialize(paper)


@router.get("/approval-centre")
async def list_pending_approvals(
    school_id: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if _role(user) not in REVIEWER_ROLES:
        raise HTTPException(403, "Only authorized reviewers can access approvals.")

    target = _school_id(user, school_id)
    result = await db.execute(
        select(ExamPaper)
        .where(
            ExamPaper.school_id == target,
            ExamPaper.status == "PENDING_APPROVAL",
        )
        .order_by(ExamPaper.updated_at.asc())
    )
    return [_serialize(item) for item in result.scalars().all()]


@router.post("/approval-centre/{paper_id}/decision")
async def decide_exam_paper(
    paper_id: int,
    payload: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if _role(user) not in REVIEWER_ROLES:
        raise HTTPException(403, "Only authorized reviewers can decide approvals.")

    result = await db.execute(
        select(ExamPaper).where(ExamPaper.id == paper_id)
    )
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(404, "Exam paper not found.")

    check_school_access(user, paper.school_id)
    if paper.status != "PENDING_APPROVAL":
        raise HTTPException(409, "This paper is not awaiting approval.")

    decision = str(payload.get("decision", "")).strip().upper()
    feedback = payload.get("feedback")
    if decision not in {"APPROVED", "REJECTED"}:
        raise HTTPException(400, "Decision must be APPROVED or REJECTED.")
    if decision == "REJECTED" and not str(feedback or "").strip():
        raise HTTPException(400, "Feedback is required when rejecting a paper.")

    paper.status = decision
    db.add(
        ExamPaperReview(
            paper_id=paper.id,
            school_id=paper.school_id,
            reviewer_id=user.id,
            decision=decision,
            feedback=str(feedback).strip() if feedback is not None else None,
        )
    )
    await db.commit()
    await db.refresh(paper)
    return _serialize(paper)


@router.get("/approval-centre/{paper_id}/history")
async def exam_paper_review_history(
    paper_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if _role(user) not in REVIEWER_ROLES:
        raise HTTPException(403, "Only authorized reviewers can view review history.")

    result = await db.execute(
        select(ExamPaper).where(ExamPaper.id == paper_id)
    )
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(404, "Exam paper not found.")

    check_school_access(user, paper.school_id)
    reviews_result = await db.execute(
        select(ExamPaperReview)
        .where(ExamPaperReview.paper_id == paper.id)
        .order_by(ExamPaperReview.created_at.asc())
    )
    return [
        {
            "id": review.id,
            "paper_id": review.paper_id,
            "reviewer_id": review.reviewer_id,
            "decision": review.decision,
            "feedback": review.feedback,
            "created_at": review.created_at.isoformat() if review.created_at else None,
        }
        for review in reviews_result.scalars().all()
    ]
