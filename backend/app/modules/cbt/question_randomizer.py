import random


class QuestionRandomizer:

    @staticmethod
    def shuffle(
        questions,
    ):

        random.shuffle(
            questions
        )

        return questions
