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

        # strict=False allows raw control characters (newlines, tabs) inside
        # string values, which Gemini often emits when embedding code snippets.
        try:
            return json.loads(text, strict=False)
        except json.JSONDecodeError:
            return json.loads(self._sanitize_control_chars(text), strict=False)

    @staticmethod
    def _sanitize_control_chars(text: str) -> str:
        """Escape stray control characters that appear inside JSON string
        literals so the payload becomes parseable."""
        out: list[str] = []
        in_string = False
        escaped = False
        for ch in text:
            if in_string:
                if escaped:
                    out.append(ch)
                    escaped = False
                    continue
                if ch == "\\":
                    out.append(ch)
                    escaped = True
                    continue
                if ch == '"':
                    out.append(ch)
                    in_string = False
                    continue
                if ch == "\n":
                    out.append("\\n")
                elif ch == "\r":
                    out.append("\\r")
                elif ch == "\t":
                    out.append("\\t")
                elif ord(ch) < 0x20:
                    out.append(f"\\u{ord(ch):04x}")
                else:
                    out.append(ch)
            else:
                out.append(ch)
                if ch == '"':
                    in_string = True
        return "".join(out)

    def complete_json(self, system_prompt: str, user_prompt: str, retries: int = 2) -> Any:
        self._ensure_configured()
        model = genai.GenerativeModel(
            self.model_name,
            system_instruction=system_prompt,
        )

        last_error: Exception | None = None
        for attempt in range(retries + 1):
            response = model.generate_content(
                user_prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.2 + 0.1 * attempt,
                    response_mime_type="application/json",
                    max_output_tokens=8192,
                ),
                request_options={"timeout": 90},
            )
            content = response.text or "{}"
            try:
                return self._extract_json(content)
            except json.JSONDecodeError as exc:
                last_error = exc

        raise RuntimeError(
            f"LLM returned invalid JSON after {retries + 1} attempts: {last_error}"
        )
