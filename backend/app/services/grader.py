import json
import re

from app.config import settings
from app.services.llm import LLMService


class GraderService:
    def __init__(self) -> None:
        self.llm = LLMService()

    def grade_quiz(self, quiz: dict, answers: dict[str, str]) -> dict:
        questions = quiz.get("questions", [])
        if not questions:
            raise ValueError("Quiz has no questions")

        results = []
        correct = 0
        for question in questions:
            qid = question["id"]
            submitted = (answers.get(qid) or "").strip()
            expected = str(question.get("answer", "")).strip()
            qtype = question.get("type", "multiple_choice")

            if qtype == "short_answer":
                is_correct = self._normalize(submitted) == self._normalize(expected)
            else:
                is_correct = submitted.lower() == expected.lower()

            if is_correct:
                correct += 1

            results.append(
                {
                    "question_id": qid,
                    "correct": is_correct,
                    "submitted": submitted,
                    "expected": expected,
                    "explanation": question.get("explanation", ""),
                }
            )

        score = round((correct / len(questions)) * 100)
        passed = score >= settings.quiz_pass_threshold
        feedback = (
            f"You answered {correct} of {len(questions)} questions correctly."
            if passed
            else f"You need {settings.quiz_pass_threshold}% to pass. Keep reviewing the lesson."
        )
        return {"passed": passed, "score": score, "feedback": feedback, "results": results}

    def grade_challenge(self, challenge: dict, submission: str, mode: str) -> dict:
        if not submission.strip():
            return {
                "passed": False,
                "score": 0,
                "feedback": "Submission cannot be empty.",
            }

        system_prompt = (
            "You are CodeSensei grading a student coding challenge. "
            "Return strict JSON: {score:0-100, passed:boolean, feedback:string}. "
            f"Pass threshold is {settings.challenge_pass_threshold}. "
            "Grade for correctness, understanding, and alignment with the challenge prompt. "
            "For pseudocode mode, grade logic rather than syntax."
        )
        user_prompt = json.dumps(
            {
                "mode": mode,
                "challenge": {
                    "title": challenge.get("title"),
                    "prompt": challenge.get("prompt"),
                    "examples": challenge.get("examples", []),
                    "rubric": challenge.get("rubric", ""),
                },
                "submission": submission,
            },
            indent=2,
        )

        result = self.llm.complete_json(system_prompt, user_prompt)
        score = int(result.get("score", 0))
        passed = bool(result.get("passed", score >= settings.challenge_pass_threshold))
        if score >= settings.challenge_pass_threshold:
            passed = True
        return {
            "passed": passed,
            "score": score,
            "feedback": result.get("feedback", "Submission graded."),
        }

    def _normalize(self, value: str) -> str:
        return re.sub(r"\s+", " ", value.strip().lower())
