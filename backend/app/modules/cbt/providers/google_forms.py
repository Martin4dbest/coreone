from app.modules.cbt.google_client import (
    GoogleAPIClient,
)

from app.modules.cbt.providers.base import (
    BaseCBTProvider,
)


class GoogleFormsProvider(
    BaseCBTProvider,
):

    def __init__(
        self,
        db,
        school_id:int,
    ):
        self.client = GoogleAPIClient(
            db,
            school_id,
        )


    async def create_exam(
        self,
        exam,
    ):

        payload = {

            "info":{

                "title":exam.title,

                "documentTitle":exam.title,

            }

        }

        return await self.client.post(
            "/forms",
            payload,
        )


    async def import_exam(
        self,
        form_id,
    ):

        return await self.client.get(
            f"/forms/{form_id}"
        )


    async def sync_results(
        self,
        form_id,
    ):

        return await self.client.get(
            f"/forms/{form_id}/responses"
        )


    async def delete_exam(
        self,
        form_id,
    ):

        return True