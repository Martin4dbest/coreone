import asyncio
from typing import Any

import requests
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.permissions import require_roles
from app.core.school_access import check_school_access
from app.db.database import get_db
from app.models.school_feature import SchoolFeature
from app.models.user import User

router = APIRouter(prefix="/aloc", tags=["ALOC Question Bank"])

ALOC_ROLES = ("SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER")


def _fetch_questions(
    url: str,
    api_key: str,
    params: dict[str, Any],
) -> dict[str, Any]:
    response = requests.get(
        url,
        headers={
            "X-API-Key": api_key,
            "Accept": "application/json",
        },
        params=params,
        timeout=25,
    )

    if response.status_code in (401, 403):
        raise HTTPException(
            status_code=502,
            detail="ALOC rejected the configured API credentials. Check the backend ALOC_API_KEY.",
        )

    if response.status_code == 429:
        raise HTTPException(
            status_code=429,
            detail="ALOC rate limit reached. Please wait before searching again.",
        )

    if response.status_code == 404:
        try:
            not_found_payload = response.json()
        except ValueError:
            not_found_payload = {}

        if (
            isinstance(not_found_payload, dict)
            and not_found_payload.get("error") == "not_found"
            and "no questions found" in str(
                not_found_payload.get("message", "")
            ).lower()
        ):
            # ALOC uses HTTP 404 for a valid search with no matching questions.
            # Normalize it to an empty result so CoreOne does not show 502.
            not_found_payload["data"] = []
            not_found_payload.setdefault("pagination", None)
            return not_found_payload

    if response.status_code == 400:
        try:
            error_payload = response.json()
        except ValueError:
            error_payload = {}

        message = (
            error_payload.get("message")
            if isinstance(error_payload, dict)
            else None
        )
        raise HTTPException(
            status_code=422,
            detail=f"ALOC rejected the search filters: {message or 'Please review the selected filters.'}",
        )

    if response.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail=f"ALOC question search failed (upstream status {response.status_code}).",
        )

    try:
        payload = response.json()
    except ValueError as exc:
        raise HTTPException(
            status_code=502,
            detail="ALOC returned invalid JSON.",
        ) from exc

    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=502,
            detail="ALOC returned an unexpected response format.",
        )

    return payload



def _fetch_catalogue(url: str, api_key: str) -> dict[str, Any]:
    response = requests.get(
        url,
        headers={"X-API-Key": api_key, "Accept": "application/json"},
        timeout=25,
    )
    if response.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail=f"ALOC catalogue request failed (upstream status {response.status_code}).",
        )
    try:
        payload = response.json()
    except ValueError as exc:
        raise HTTPException(
            status_code=502,
            detail="ALOC returned invalid catalogue JSON.",
        ) from exc
    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=502,
            detail="ALOC returned an unexpected catalogue response.",
        )
    return payload


async def _check_aloc_catalogue_access(
    school_id: int | None,
    db: AsyncSession,
    current_user: User,
) -> str:
    role_name = current_user.role.name if current_user.role else ""

    if role_name == "SUPER_ADMIN":
        if school_id is None:
            raise HTTPException(
                status_code=400,
                detail="school_id is required for Super Admin catalogue requests.",
            )
        target_school_id = school_id
    else:
        target_school_id = current_user.school_id
        if school_id is not None and school_id != target_school_id:
            raise HTTPException(
                status_code=403,
                detail="You can only use ALOC for your own school.",
            )

    check_school_access(current_user, target_school_id)

    result = await db.execute(
        select(SchoolFeature).where(
            SchoolFeature.school_id == target_school_id,
            SchoolFeature.feature_key == "aloc_question_bank",
        )
    )
    feature = result.scalar_one_or_none()
    if feature is None or feature.enabled is not True:
        raise HTTPException(
            status_code=403,
            detail="ALOC Question Bank is not enabled for this school.",
        )

    api_key = settings.ALOC_API_KEY.strip()
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="ALOC is not configured. Set ALOC_API_KEY in the backend environment.",
        )

    return api_key


@router.get("/subjects")
async def get_aloc_subjects(
    school_id: int | None = Query(default=None, ge=1),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*ALOC_ROLES)),
):
    api_key = await _check_aloc_catalogue_access(school_id, db, current_user)
    url = f"{settings.ALOC_BASE_URL.rstrip('/')}/subjects"
    try:
        return await asyncio.to_thread(_fetch_catalogue, url, api_key)
    except requests.Timeout as exc:
        raise HTTPException(status_code=504, detail="ALOC catalogue request timed out.") from exc
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail="Could not connect to the ALOC catalogue.") from exc


@router.get("/subjects/{subject}/topics")
async def get_aloc_topics(
    subject: str,
    school_id: int | None = Query(default=None, ge=1),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*ALOC_ROLES)),
):
    api_key = await _check_aloc_catalogue_access(school_id, db, current_user)
    from urllib.parse import quote

    encoded_subject = quote(subject.strip(), safe="")
    url = f"{settings.ALOC_BASE_URL.rstrip('/')}/subjects/{encoded_subject}/topics"
    try:
        return await asyncio.to_thread(_fetch_catalogue, url, api_key)
    except requests.Timeout as exc:
        raise HTTPException(status_code=504, detail="ALOC topic request timed out.") from exc
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail="Could not connect to ALOC topics.") from exc


@router.get("/questions")
async def search_aloc_questions(
    school_id: int | None = Query(default=None, ge=1),
    subject: str | None = Query(default=None, min_length=1, max_length=100),
    examType: str | None = Query(default=None),
    year: int | None = Query(default=None, ge=1990, le=2030),
    topic: str | None = Query(default=None, max_length=120),
    difficulty: str | None = Query(default=None, max_length=40),
    country: str | None = Query(default=None, max_length=80),
    random: bool | None = None,
    cursor: str | None = Query(default=None, max_length=500),
    limit: int = Query(default=15, ge=1, le=15),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*ALOC_ROLES)),
):
    role_name = current_user.role.name if current_user.role else ""

    if role_name == "SUPER_ADMIN":
        if school_id is None:
            raise HTTPException(
                status_code=400,
                detail="school_id is required for Super Admin searches.",
            )
        target_school_id = school_id
    else:
        target_school_id = current_user.school_id

        if school_id is not None and school_id != target_school_id:
            raise HTTPException(
                status_code=403,
                detail="You can only use ALOC for your own school.",
            )

    check_school_access(current_user, target_school_id)

    result = await db.execute(
        select(SchoolFeature).where(
            SchoolFeature.school_id == target_school_id,
            SchoolFeature.feature_key == "aloc_question_bank",
        )
    )
    feature = result.scalar_one_or_none()

    if feature is None or feature.enabled is not True:
        raise HTTPException(
            status_code=403,
            detail="ALOC Question Bank is not enabled for this school.",
        )

    if not any((subject, examType, year is not None)):
        raise HTTPException(
            status_code=422,
            detail="Provide at least one search filter: subject, examType, or year.",
        )

    if examType and examType.lower() not in {
        "waec", "neco", "jamb", "post_utme", "state"
    }:
        raise HTTPException(
            status_code=422,
            detail="Unsupported examType. Use waec, neco, jamb, post_utme, or state.",
        )

    api_key = settings.ALOC_API_KEY.strip()
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="ALOC is not configured. Set ALOC_API_KEY in the backend environment.",
        )

    params: dict[str, Any] = {"limit": limit}

    difficulty_score = None
    if difficulty is not None and difficulty.strip():
        difficulty_value = difficulty.strip().lower()
        difficulty_labels = {
            "easy": 1,
            "medium": 3,
            "hard": 5,
        }
        try:
            difficulty_score = int(difficulty_value)
        except ValueError:
            difficulty_score = difficulty_labels.get(difficulty_value)

        if difficulty_score is None:
            raise HTTPException(
                status_code=422,
                detail="Invalid difficulty. Choose Easy, Medium, Hard, or a numeric ALOC difficulty score.",
            )

    filters = {
        "subject": subject.strip() if subject else None,
        "examType": examType.lower().strip() if examType else None,
        "year": year,
        "topic": topic.strip() if topic else None,
        "difficulty": difficulty_score,
        "country": country.strip() if country else None,
        "random": random,
        "cursor": cursor,
    }

    params.update({
        key: value
        for key, value in filters.items()
        if value is not None and value != ""
    })

    url = f"{settings.ALOC_BASE_URL.rstrip('/')}/questions"

    try:
        return await asyncio.to_thread(
            _fetch_questions,
            url,
            api_key,
            params,
        )
    except requests.Timeout as exc:
        raise HTTPException(
            status_code=504,
            detail="ALOC took too long to respond. Please try again.",
        ) from exc
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail="Could not connect to ALOC. Please try again later.",
        ) from exc
