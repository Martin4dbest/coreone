class GoogleFeedbackImporter:

    @staticmethod
    def extract(item: dict):

        grading = (
            item.get("questionItem", {})
                .get("grading", {})
        )

        feedback = grading.get(
            "generalFeedback",
            {}
        )

        return feedback.get(
            "text"
        )