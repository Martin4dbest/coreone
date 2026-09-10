from cryptography.fernet import Fernet, InvalidToken

from app.core.config import get_settings


class PaymentCredentialCrypto:
    """Encrypt and decrypt school payment-provider credentials."""

    @staticmethod
    def _fernet() -> Fernet:
        key = get_settings().PAYMENT_ENCRYPTION_KEY

        if not key:
            raise RuntimeError(
                "PAYMENT_ENCRYPTION_KEY is not configured"
            )

        try:
            return Fernet(key.encode())
        except Exception as exc:
            raise RuntimeError(
                "PAYMENT_ENCRYPTION_KEY is invalid"
            ) from exc

    @classmethod
    def encrypt(cls, value: str) -> str:
        if not value:
            raise ValueError("Credential cannot be empty")

        return cls._fernet().encrypt(
            value.encode("utf-8")
        ).decode("utf-8")

    @classmethod
    def decrypt(cls, value: str) -> str:
        if not value:
            raise ValueError("Encrypted credential is empty")

        try:
            return cls._fernet().decrypt(
                value.encode("utf-8")
            ).decode("utf-8")
        except InvalidToken as exc:
            raise RuntimeError(
                "Unable to decrypt payment credential"
            ) from exc
