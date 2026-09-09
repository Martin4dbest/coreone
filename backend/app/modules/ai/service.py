from __future__ import annotations

import asyncio
import json
from typing import Optional

from google import genai
from openai import AsyncOpenAI

from app.core.config import settings

from .schemas import CBTQuestionRequest, CBTQuestionResponse


class AIService:
    GEMINI_MAX_RETRIES = 3
    GEMINI_RETRY_DELAYS = (1, 2, 4)

    def __init__(self) -> None:
        self.openai_client: Optional[AsyncOpenAI] = None
        self.gemini_client: Optional[genai.Client] = None

        self.openai_model = settings.OPENAI_AI_MODEL
        self.gemini_model = settings.GEMINI_AI_MODEL

        self.gemini_fallback_models = [
            model.strip()
            for model in settings.GEMINI_AI_FALLBACK_MODELS.split(",")
            if model.strip()
        ]

        if settings.OPENAI_API_KEY:
            self.openai_client = AsyncOpenAI(
                api_key=settings.OPENAI_API_KEY
            )

        if settings.GEMINI_API_KEY:
            self.gemini_client = genai.Client(
                api_key=settings.GEMINI_API_KEY
            )

    def _get_openai_client(self) -> AsyncOpenAI:
        if self.openai_client is None:
            if not settings.OPENAI_API_KEY:
                raise RuntimeError(
                    "OpenAI AI provider is not configured."
                )

            self.openai_client = AsyncOpenAI(
                api_key=settings.OPENAI_API_KEY
            )

        return self.openai_client

    def _get_gemini_client(self) -> genai.Client:
        if self.gemini_client is None:
            if not settings.GEMINI_API_KEY:
                raise RuntimeError(
                    "Gemini AI provider is not configured."
                )

            self.gemini_client = genai.Client(
                api_key=settings.GEMINI_API_KEY
            )

        return self.gemini_client

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

    def _build_prompt(
        self,
        request: CBTQuestionRequest,
    ) -> str:
        return f"""
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
- Do not include student personal information.

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
""".strip()

    def _parse_response(
        self,
        raw_text: str,
        request: CBTQuestionRequest,
    ) -> CBTQuestionResponse:
        text = raw_text.strip()

        if text.startswith("```"):
            lines = text.splitlines()

            if lines and lines[0].strip().startswith("```"):
                lines = lines[1:]

            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]

            text = "\n".join(lines).strip()

        try:
            payload = json.loads(text)
        except json.JSONDecodeError as exc:
            raise RuntimeError(
                "AI returned an invalid question format."
            ) from exc

        questions = payload.get("questions")

        if not isinstance(questions, list):
            raise RuntimeError(
                "AI returned an invalid questions payload."
            )

        if len(questions) != request.number_of_questions:
            raise RuntimeError(
                "AI returned an incorrect number of questions."
            )

        for question in questions:
            if not isinstance(question, dict):
                raise RuntimeError(
                    "AI returned an invalid question item."
                )

            if not isinstance(
                question.get("question"),
                str,
            ):
                raise RuntimeError(
                    "AI returned a question without valid text."
                )

            options = question.get("options")

            if not isinstance(options, list) or len(options) != 4:
                raise RuntimeError(
                    "AI returned a question without exactly four options."
                )

            if question.get("correct_answer") not in {
                "A",
                "B",
                "C",
                "D",
            }:
                raise RuntimeError(
                    "AI returned an invalid correct answer."
                )

            if not isinstance(
                question.get("explanation"),
                str,
            ):
                raise RuntimeError(
                    "AI returned a question without a valid explanation."
                )

        return CBTQuestionResponse(
            subject=request.subject,
            topic=request.topic,
            class_name=request.class_name,
            questions=questions,
        )

    @staticmethod
    def _is_retryable_gemini_error(exc: Exception) -> bool:
        message = str(exc).lower()

        return any(
            marker in message
            for marker in (
                "503",
                "429",
                "unavailable",
                "resource_exhausted",
                "overloaded",
                "temporarily unavailable",
                "deadline exceeded",
            )
        )

    async def _generate_with_gemini_model(
        self,
        request: CBTQuestionRequest,
        model: str,
    ) -> CBTQuestionResponse:
        client = self._get_gemini_client()

        interaction = await client.aio.interactions.create(
            model=model,
            input=self._build_prompt(request),
            response_format={
                "type": "text",
                "mime_type": "application/json",
            },
        )

        raw_text = getattr(
            interaction,
            "output_text",
            None,
        )

        if not raw_text:
            raise RuntimeError(
                f"Gemini returned an empty response from {model}."
            )

        return self._parse_response(
            raw_text,
            request,
        )

    async def _generate_with_gemini(
        self,
        request: CBTQuestionRequest,
    ) -> CBTQuestionResponse:
        models = [self.gemini_model]

        for model in self.gemini_fallback_models:
            if model and model not in models:
                models.append(model)

        errors: list[str] = []

        for model in models:
            for attempt in range(
                self.GEMINI_MAX_RETRIES
            ):
                try:
                    print(
                        f"CoreOne Gemini attempt "
                        f"{attempt + 1}/{self.GEMINI_MAX_RETRIES} "
                        f"using {model}"
                    )

                    return await self._generate_with_gemini_model(
                        request,
                        model,
                    )

                except Exception as exc:
                    print(
                        f"CoreOne Gemini error "
                        f"[{model}, attempt {attempt + 1}]:",
                        repr(exc),
                    )

                    errors.append(
                        f"{model}: {exc}"
                    )

                    if not self._is_retryable_gemini_error(
                        exc
                    ):
                        break

                    if attempt < self.GEMINI_MAX_RETRIES - 1:
                        await asyncio.sleep(
                            self.GEMINI_RETRY_DELAYS[attempt]
                        )

        raise RuntimeError(
            "Gemini could not generate the requested questions."
        )

    async def _generate_with_openai(
        self,
        request: CBTQuestionRequest,
    ) -> CBTQuestionResponse:
        client = self._get_openai_client()

        response = await client.responses.create(
            model=self.openai_model,
            input=self._build_prompt(request),
        )

        raw_text = response.output_text.strip()

        if not raw_text:
            raise RuntimeError(
                "OpenAI returned an empty response."
            )

        return self._parse_response(
            raw_text,
            request,
        )

    async def generate_cbt_questions(
        self,
        request: CBTQuestionRequest,
    ) -> CBTQuestionResponse:
        if settings.AI_MOCK_MODE:
            return self._generate_mock_questions(request)

        primary = (
            settings.AI_PRIMARY_PROVIDER.strip().lower()
        )

        if primary not in {
            "gemini",
            "openai",
        }:
            primary = "gemini"

        providers = (
            ["gemini", "openai"]
            if primary == "gemini"
            else ["openai", "gemini"]
        )

        if not settings.AI_ENABLE_OPENAI_FALLBACK:
            providers = [primary]

        errors: list[str] = []

        for provider in providers:
            try:
                if provider == "gemini":
                    if not settings.GEMINI_API_KEY:
                        errors.append(
                            "Gemini API key is not configured."
                        )
                        continue

                    return await self._generate_with_gemini(
                        request
                    )

                if not settings.OPENAI_API_KEY:
                    errors.append(
                        "OpenAI API key is not configured."
                    )
                    continue

                return await self._generate_with_openai(
                    request
                )

            except Exception as exc:
                print(
                    f"CoreOne AI provider error [{provider}]:",
                    repr(exc),
                )

                errors.append(
                    f"{provider}: {exc}"
                )

        raise RuntimeError(
            "CoreOne AI could not generate the requested questions."
        )


ai_service = AIService()
