import asyncio
import logging

import requests

from app.core.config import settings

logger = logging.getLogger(__name__)


def _post_json(path: str, payload: dict) -> requests.Response:
    base_url = settings.COREONE_REFERRAL_API_URL.rstrip("/")
    secret = settings.COREONE_REFERRAL_API_SECRET

    if not base_url or not secret:
        raise RuntimeError("PartnerHub referral integration is not configured.")

    return requests.post(
        f"{base_url}{path}",
        json=payload,
        headers={"Authorization": f"Bearer {secret}"},
        timeout=4,
    )


async def validate_referral_code(code: str) -> bool | None:
    """Return True if valid, False if invalid, or None if unavailable."""
    try:
        response = await asyncio.to_thread(
            _post_json,
            "/api/referrals/validate",
            {"code": code.strip()},
        )

        if response.status_code == 200:
            return response.json().get("valid") is True

        if response.status_code == 400:
            return False

        logger.warning(
            "PartnerHub referral validation returned HTTP %s.",
            response.status_code,
        )
        return None
    except (requests.RequestException, RuntimeError, ValueError) as exc:
        logger.warning("PartnerHub referral validation unavailable: %s", exc)
        return None


async def record_school_referral(code: str, school_id: int) -> None:
    try:
        response = await asyncio.to_thread(
            _post_json,
            "/api/referrals/events",
            {
                "code": code.strip(),
                "product": "coreone_school_app",
                "eventType": "school_created",
                "externalEntityId": str(school_id),
            },
        )

        if response.status_code not in (200, 201):
            logger.warning(
                "PartnerHub referral event was not recorded (HTTP %s).",
                response.status_code,
            )
    except (requests.RequestException, RuntimeError, ValueError) as exc:
        logger.warning("PartnerHub referral event could not be recorded: %s", exc)
