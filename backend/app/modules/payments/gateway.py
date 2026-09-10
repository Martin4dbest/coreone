from __future__ import annotations

import hashlib
import hmac
from typing import Any

import httpx


class PaystackGatewayError(Exception):
    """Raised when communication with Paystack fails."""


class PaystackGateway:
    """
    Paystack gateway client for a single school's Paystack account.

    The secret key belongs to the school and must never be exposed
    to the mobile application or API response.
    """

    BASE_URL = "https://api.paystack.co"

    def __init__(
        self,
        secret_key: str,
        *,
        timeout: float = 30.0,
    ):
        if not secret_key or not secret_key.strip():
            raise ValueError("Paystack secret key is required")

        self.secret_key = secret_key.strip()
        self.timeout = timeout

    @property
    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    async def initialize_transaction(
        self,
        *,
        email: str,
        amount_kobo: int,
        reference: str,
        currency: str = "NGN",
        callback_url: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Initialize a Paystack transaction.

        Paystack expects NGN amounts in kobo.
        """

        if amount_kobo <= 0:
            raise ValueError("Payment amount must be greater than zero")

        payload: dict[str, Any] = {
            "email": email,
            "amount": amount_kobo,
            "reference": reference,
            "currency": currency,
        }

        if callback_url:
            payload["callback_url"] = callback_url

        if metadata:
            payload["metadata"] = metadata

        try:
            async with httpx.AsyncClient(
                timeout=self.timeout,
            ) as client:
                response = await client.post(
                    f"{self.BASE_URL}/transaction/initialize",
                    headers=self._headers,
                    json=payload,
                )
        except httpx.HTTPError as exc:
            raise PaystackGatewayError(
                "Unable to connect to Paystack"
            ) from exc

        try:
            data = response.json()
        except ValueError as exc:
            raise PaystackGatewayError(
                "Paystack returned an invalid response"
            ) from exc

        if response.status_code >= 400 or not data.get("status"):
            message = data.get(
                "message",
                "Paystack transaction initialization failed",
            )

            raise PaystackGatewayError(message)

        result = data.get("data")

        if not isinstance(result, dict):
            raise PaystackGatewayError(
                "Paystack initialization response is invalid"
            )

        return result

    async def verify_transaction(
        self,
        reference: str,
    ) -> dict[str, Any]:
        """
        Verify a transaction directly with Paystack.

        The caller must still validate the returned status,
        reference, amount, currency, and transaction identity
        before marking a CoreOne payment successful.
        """

        if not reference or not reference.strip():
            raise ValueError("Transaction reference is required")

        reference = reference.strip()

        try:
            async with httpx.AsyncClient(
                timeout=self.timeout,
            ) as client:
                response = await client.get(
                    f"{self.BASE_URL}/transaction/verify/{reference}",
                    headers=self._headers,
                )
        except httpx.HTTPError as exc:
            raise PaystackGatewayError(
                "Unable to connect to Paystack"
            ) from exc

        try:
            data = response.json()
        except ValueError as exc:
            raise PaystackGatewayError(
                "Paystack returned an invalid response"
            ) from exc

        if response.status_code >= 400 or not data.get("status"):
            message = data.get(
                "message",
                "Paystack transaction verification failed",
            )

            raise PaystackGatewayError(message)

        result = data.get("data")

        if not isinstance(result, dict):
            raise PaystackGatewayError(
                "Paystack verification response is invalid"
            )

        return result

    @staticmethod
    def verify_webhook_signature(
        *,
        payload: bytes,
        signature: str | None,
        secret_key: str,
    ) -> bool:
        """
        Validate Paystack's x-paystack-signature.

        Paystack signs the raw request body with HMAC SHA512
        using the school's Paystack secret key.
        """

        if not signature:
            return False

        if not secret_key:
            return False

        expected_signature = hmac.new(
            secret_key.encode("utf-8"),
            payload,
            hashlib.sha512,
        ).hexdigest()

        return hmac.compare_digest(
            expected_signature,
            signature.strip(),
        )
