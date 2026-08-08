from app.modules.cbt.providers.google_forms import (
    GoogleFormsProvider,
)


class GoogleImportService:

    def __init__(
        self,
        db,
        school_id:int,
    ):
        self.provider = GoogleFormsProvider(
            db,
            school_id,
        )


    async def import_form(
        self,
        form_id:str,
    ):

        return await self.provider.import_exam(
            form_id
        )


    async def import_responses(
        self,
        form_id:str,
    ):

        return await self.provider.sync_results(
            form_id
        )