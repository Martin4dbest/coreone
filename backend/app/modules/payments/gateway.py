from __future__ import annotations

import hashlib
import hmac
from typing import Any

import httpx


class PaystackGatewayError(RuntimeError):
    pass


class PaystackGateway:
    BASE_URL = "https://api.paystack.co"

    def __init__(self, secret_key: str):
        self.secret_key = secret_key.strip()

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
        amount: int,
        reference: str,
        currency: str = "NGN",
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "email": email,
            "amount": amount,
            "reference": reference,
            "currency": currency,
        }

        if metadata:
            payload["metadata"] = metadata

        try:
            async with httpx.AsyncClient(
                timeout=httpx.Timeout(30.0, connect=10.0)
            ) as client:
                response = await client.post(
                    f"{self.BASE_URL}/transaction/initialize",
                    headers=self._headers,
                    json=payload,
                )

            try:
                data = response.json()
            except Exception:
                data = {"raw_response": response.text}

            if response.status_code >= 400:
                raise PaystackGatewayError(
                    f"Paystack initialization failed "
                    f"(HTTP {response.status_code}): {data}"
                )

            if not data.get("status"):
                raise PaystackGatewayError(
                    f"Paystack initialization rejected the request: {data}"
                )

            result = data.get("data")

            if not isinstance(result, dict):
                raise PaystackGatewayError(
                    f"Paystack returned an invalid initialization response: {data}"
                )

            return result

        except httpx.HTTPError as exc:
            raise PaystackGatewayError(
                f"Unable to connect to Paystack: {exc}"
            ) from exc

    async def verify_transaction(
        self,
        reference: str,
    ) -> dict[str, Any]:
        try:
            async with httpx.AsyncClient(
                timeout=httpx.Timeout(30.0, connect=10.0)
            ) as client:
                response = await client.get(
                    f"{self.BASE_URL}/transaction/verify/{reference}",
                    headers=self._headers,
                )

            try:
                data = response.json()
            except Exception:
                data = {"raw_response": response.text}

            if response.status_code >= 400:
                raise RuntimeError(
                    f"Paystack verification failed "
                    f"(HTTP {response.status_code}): {data}"
                )

            return data

        except httpx.HTTPError as exc:
            raise RuntimeError(
                f"Unable to connect to Paystack: {exc}"
            ) from exc

    def verify_webhook_signature(
        self,
        payload: bytes,
        signature: str | None,
    ) -> bool:
        if not signature:
            return False

        expected = hmac.new(
            self.secret_key.encode("utf-8"),
            payload,
            hashlib.sha512,
        ).hexdigest()

        return hmac.compare_digest(expected, signature)
