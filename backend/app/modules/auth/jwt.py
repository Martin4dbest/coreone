from datetime import UTC, datetime, timedelta

from jose import JWTError, jwt

from app.core.config import settings


def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None,
) -> str:
    payload = data.copy()

    expire = datetime.now(UTC) + (
        expires_delta
        or timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    payload["exp"] = expire

    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def decode_access_token(token: str):
    try:
        return jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

    except JWTError:
        return None


def create_password_reset_token(
    user_id: int,
) -> str:
    return create_access_token(
        {
            "sub": str(user_id),
            "token_type": "password_reset",
        },
        expires_delta=timedelta(minutes=15),
    )