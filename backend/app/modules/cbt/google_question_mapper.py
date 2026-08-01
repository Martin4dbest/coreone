from app.models.cbt_question import CBTQuestion

from app.modules.cbt.google_media_importer import (
    GoogleMediaImporter,
)


from app.modules.cbt.google_marks_importer import (
    GoogleMarksImporter,
)

from app.modules.cbt.google_feedback_importer import (
    GoogleFeedbackImporter,
)

from app.modules.cbt.google_section_importer import (
    GoogleSectionImporter,
)

from app.modules.cbt.google_answer_importer import (
    GoogleAnswerImporter,
)



class GoogleQuestionMapper:

    @staticmethod
    def map(
        school_id:int,
        exam_id:int,
        item:dict,
    ):

        question = item.get("questionItem", {})

        q = CBTQuestion(

            school_id=school_id,

            exam_id=exam_id,

            question=question.get(
                "question", {}
            ).get(
                "text",
                "",
            ),

            question_type="objective",

            option_a="",

            option_b="",

            option_c="",

            option_d="",

            correct_answer="",

            explanation=None,

            marks=1,

            randomize_options=False,

            is_active=True,

        )

        choice = question.get(
            "choiceQuestion"
        )

        if choice:

            options = choice.get(
                "options",
                []
            )

            if len(options) > 0:
                q.option_a = options[0]["value"]

            if len(options) > 1:
                q.option_b = options[1]["value"]

            if len(options) > 2:
                q.option_c = options[2]["value"]

            if len(options) > 3:
                q.option_d = options[3]["value"]

        
        media = GoogleMediaImporter.extract(
            item
        )

        if hasattr(q, "image_url"):
            q.image_url = media["image"]

        if hasattr(q, "video_url"):
            q.video_url = media["video"]

        
        answer = GoogleAnswerImporter.extract(
            item
        )

        if answer:
            q.correct_answer = answer

        q.marks = GoogleMarksImporter.extract(
            item
        )

        if hasattr(q, "feedback"):
            q.feedback = GoogleFeedbackImporter.extract(
                item
            )

        if hasattr(q, "section_name"):
            section = GoogleSectionImporter.extract(
                item
            )

            if section["is_section"]:
                q.section_name = section["title"]


        return q


