from datetime import datetime, timedelta, UTC

from jose import jwt, JWTError

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



def decode_access_token(
    token: str,
):

    try:
        return jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

    except JWTError:
        return None
