import random


class OptionRandomizer:

    @staticmethod
    def shuffle(question):

        options = [

            question.option_a,
            question.option_b,
            question.option_c,
            question.option_d,

        ]

        random.shuffle(
            options
        )

        (
            question.option_a,
            question.option_b,
            question.option_c,
            question.option_d,
        ) = options

        return question
