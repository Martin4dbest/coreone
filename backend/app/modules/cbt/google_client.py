import httpx

from app.modules.cbt.google_repository import (
    GoogleTokenRepository,
)


class GoogleAPIClient:

    BASE = "https://forms.googleapis.com/v1"

    def __init__(
        self,
        db,
        school_id:int,
    ):
        self.db = db
        self.school_id = school_id
        self.repository = GoogleTokenRepository(db)

    async def headers(self):

        token = await self.repository.get(
            self.school_id
        )

        if token is None:
            raise Exception(
                "Google account not connected."
            )

        return {
            "Authorization":
            f"Bearer {token.access_token}",

            "Content-Type":
            "application/json",
        }

    async def get(
        self,
        endpoint,
    ):

        async with httpx.AsyncClient() as client:

            response = await client.get(

                self.BASE + endpoint,

                headers=await self.headers(),

            )

            response.raise_for_status()

            return response.json()

    async def post(
        self,
        endpoint,
        payload,
    ):

        async with httpx.AsyncClient() as client:

            response = await client.post(

                self.BASE + endpoint,

                headers=await self.headers(),

                json=payload,

            )

            response.raise_for_status()

            return response.json()

    async def patch(
        self,
        endpoint,
        payload,
    ):

        async with httpx.AsyncClient() as client:

            response = await client.patch(

                self.BASE + endpoint,

                headers=await self.headers(),

                json=payload,

            )

            response.raise_for_status()

            return response.json()

    async def delete(
        self,
        endpoint,
    ):

        async with httpx.AsyncClient() as client:

            response = await client.delete(

                self.BASE + endpoint,

                headers=await self.headers(),

            )

            response.raise_for_status()

            return True
