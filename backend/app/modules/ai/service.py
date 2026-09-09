import json
from typing import Optional

from openai import AsyncOpenAI

from app.core.config import settings

from .schemas import CBTQuestionRequest, CBTQuestionResponse


class AIService:
    def __init__(self) -> None:
        self.client: Optional[AsyncOpenAI] = None
        self.model = settings.OPENAI_AI_MODEL

        if settings.OPENAI_API_KEY:
            self.client = AsyncOpenAI(
                api_key=settings.OPENAI_API_KEY
            )

    def _get_client(self) -> AsyncOpenAI:
        if self.client is None:
            if not settings.OPENAI_API_KEY:
                raise RuntimeError(
                    "CoreOne AI is not configured. "
                    "Please configure OPENAI_API_KEY."
                )

            self.client = AsyncOpenAI(
                api_key=settings.OPENAI_API_KEY
            )

        return self.client

    def _generate_mock_questions(
        self,
        request: CBTQuestionRequest,
    ) -> CBTQuestionResponse:
        question_bank = [
            {
                "question": (
                    f"Which statement best describes {request.topic} "
                    f"in {request.subject}?"
                ),
                "options": [
                    "A. It is an important concept in the topic being studied.",
                    "B. It is unrelated to the topic.",
                    "C. It applies only outside the subject.",
                    "D. It has no educational value.",
                ],
                "correct_answer": "A",
                "explanation": (
                    f"This is the best answer because it directly relates "
                    f"to {request.topic} in {request.subject}."
                ),
            },
            {
                "question": (
                    f"What is an important thing students should understand "
                    f"about {request.topic}?"
                ),
                "options": [
                    "A. Its key principles and applications.",
                    "B. Only its spelling.",
                    "C. Nothing about its meaning.",
                    "D. Information from an unrelated subject.",
                ],
                "correct_answer": "A",
                "explanation": (
                    f"Understanding the key principles and applications "
                    f"helps students master {request.topic}."
                ),
            },
            {
                "question": (
                    f"Which approach is most appropriate when learning "
                    f"{request.topic}?"
                ),
                "options": [
                    "A. Understand the concept and apply it to examples.",
                    "B. Ignore the concept completely.",
                    "C. Memorize unrelated information.",
                    "D. Avoid practising the topic.",
                ],
                "correct_answer": "A",
                "explanation": (
                    f"Learning {request.topic} effectively requires "
                    "understanding the concept and applying it."
                ),
            },
        ]

        questions = []

        for index in range(request.number_of_questions):
            source = question_bank[index % len(question_bank)]

            questions.append(
                {
                    **source,
                    "question": (
                        f"{index + 1}. "
                        f"{source['question']}"
                    ),
                }
            )

        return CBTQuestionResponse(
            subject=request.subject,
            topic=request.topic,
            class_name=request.class_name,
            questions=questions,
        )

    async def generate_cbt_questions(
        self,
        request: CBTQuestionRequest,
    ) -> CBTQuestionResponse:
        if settings.AI_MOCK_MODE:
            return self._generate_mock_questions(request)

        client = self._get_client()

        prompt = f"""
You are the CoreOne AI Academic Assistant.

Generate {request.number_of_questions} high-quality multiple-choice
questions for:

Subject: {request.subject}
Class: {request.class_name}
Topic: {request.topic}
Difficulty: {request.difficulty}

Requirements:
- Questions must be appropriate for the stated class level.
- Exactly 4 options for every question.
- Exactly one correct answer.
- Include a short explanation.
- Avoid ambiguous questions.
- Avoid duplicate questions.
- Use clear educational language.
- Do not include markdown.

Return ONLY valid JSON in this exact structure:

{{
  "questions": [
    {{
      "question": "Question text",
      "options": [
        "A. Option one",
        "B. Option two",
        "C. Option three",
        "D. Option four"
      ],
      "correct_answer": "A",
      "explanation": "Short explanation"
    }}
  ]
}}
"""

        try:
            response = await client.responses.create(
                model=self.model,
                input=prompt,
            )
        except Exception as exc:
            raise RuntimeError(
                "CoreOne AI could not reach the AI service."
            ) from exc

        raw_text = response.output_text.strip()

        try:
            payload = json.loads(raw_text)
        except json.JSONDecodeError as exc:
            raise RuntimeError(
                "AI returned an invalid question format."
            ) from exc

        questions = payload.get("questions")

        if not isinstance(questions, list):
            raise RuntimeError(
                "AI returned an invalid questions payload."
            )

        return CBTQuestionResponse(
            subject=request.subject,
            topic=request.topic,
            class_name=request.class_name,
            questions=questions,
        )


ai_service = AIService()
