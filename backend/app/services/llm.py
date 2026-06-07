import json
import re
from typing import Any

import google.generativeai as genai

from app.config import settings


class LLMService:
    def __init__(self) -> None:
        self.model_name = settings.gemini_model
        if settings.gemini_api_key:
            genai.configure(api_key=settings.gemini_api_key)

    def _ensure_configured(self) -> None:
        if not settings.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured")

    def _extract_json(self, text: str) -> Any:
        text = text.strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\n?", "", text)
            text = re.sub(r"\n?```$", "", text)
        return json.loads(text)

    def complete_json(self, system_prompt: str, user_prompt: str) -> Any:
        self._ensure_configured()
        model = genai.GenerativeModel(
            self.model_name,
            system_instruction=system_prompt,
        )
        response = model.generate_content(
            user_prompt,
            generation_config=genai.GenerationConfig(
                temperature=0.2,
                response_mime_type="application/json",
            ),
        )
        content = response.text or "{}"
        return self._extract_json(content)
