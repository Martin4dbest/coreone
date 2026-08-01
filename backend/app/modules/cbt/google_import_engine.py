from app.modules.cbt.google_import_service import (
    GoogleImportService,
)

from app.modules.cbt.google_question_mapper import (
    GoogleQuestionMapper,
)

from app.modules.cbt.question_repository import (
    CBTQuestionRepository,
)


class GoogleImportEngine:

    def __init__(
        self,
        db,
        school_id:int,
    ):
        self.db = db
        self.school_id = school_id

        self.service = GoogleImportService(
            db,
            school_id,
        )

        self.repository = CBTQuestionRepository(
            db
        )


    async def import_questions(
        self,
        exam_id:int,
        form_id:str,
    ):

        form = await self.service.import_form(
            form_id
        )

        items = form.get(
            "items",
            []
        )

        created = 0

        for item in items:

            if "questionItem" not in item:
                continue

            question = GoogleQuestionMapper.map(

                self.school_id,

                exam_id,

                item,

            )

            await self.repository.create(
                question
            )

            created += 1

        return {

            "imported":created

        }
