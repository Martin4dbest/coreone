class GoogleAnswerImporter:

    @staticmethod
    def extract(item):

        question = item.get(
            "questionItem",
            {}
        )

        grading = question.get(
            "grading",
            {}
        )

        answers = grading.get(
            "correctAnswers",
            {}
        )

        values = answers.get(
            "answers",
            []
        )

        if not values:
            return None

        return values[0].get(
            "value"
        )