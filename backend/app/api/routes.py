import asyncio

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal, get_db
from app.models import AnonymousSession, Repo, Topic, TopicProgress
from app.schemas import (
    ChallengeResponse,
    ChallengeSubmitRequest,
    ChallengeSubmitResponse,
    ProgressEntry,
    ProgressResponse,
    QuizResponse,
    QuizSubmitRequest,
    QuizSubmitResponse,
    RepoCreateRequest,
    RepoResponse,
    SessionResponse,
    TopicCodeResponse,
    TopicDetailResponse,
    TopicListResponse,
    TopicSummary,
    AnnotatedFile,
    CodeAnnotation,
    Flashcard,
    QuizQuestion,
)
from app.services.generator import GeneratorService
from app.services.github import parse_github_url
from app.services.grader import GraderService
from app.services.indexer import IndexerService
from app.services.progress import get_or_create_progress, progress_for_topic, topic_cleared
from app.api.deps import get_optional_session_id, require_session_id

router = APIRouter()
indexer = IndexerService()
generator = GeneratorService()
grader = GraderService()


def _run_index_job(repo_id: str) -> None:
    db = SessionLocal()
    try:
        repo = db.query(Repo).filter(Repo.id == repo_id).first()
        if not repo:
            return
        asyncio.run(indexer.index_repo(db, repo))
    finally:
        db.close()


def _repo_response(repo: Repo) -> RepoResponse:
    return RepoResponse(
        id=repo.id,
        url=repo.url,
        owner=repo.owner,
        name=repo.name,
        status=repo.status,
        error_message=repo.error_message,
        topic_count=len(repo.topics),
        language_mix=repo.language_mix,
        file_tree=repo.file_tree,
        created_at=repo.created_at,
        updated_at=repo.updated_at,
    )


def _topic_summary(topic: Topic, progress: TopicProgress | None) -> TopicSummary:
    return TopicSummary(
        id=topic.id,
        title=topic.title,
        description=topic.description,
        order=topic.order,
        difficulty=topic.difficulty,
        estimated_minutes=topic.estimated_minutes,
        file_refs=topic.file_refs,
        content_status=topic.content_status,
        challenge_passed=bool(progress and progress.challenge_passed),
        quiz_passed=bool(progress and progress.quiz_passed),
        cleared=topic_cleared(progress),
    )


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/session", response_model=SessionResponse)
def create_session(db: Session = Depends(get_db)) -> SessionResponse:
    session = AnonymousSession()
    db.add(session)
    db.commit()
    db.refresh(session)
    return SessionResponse(session_id=session.id)


@router.post("/repos", response_model=RepoResponse, status_code=202)
def create_repo(
    payload: RepoCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> RepoResponse:
    try:
        parsed = parse_github_url(payload.url)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    normalized_url = f"https://github.com/{parsed.full_name}"
    repo = db.query(Repo).filter(Repo.url == normalized_url).first()

    if repo and repo.status == "ready":
        return _repo_response(repo)

    if repo and repo.status in {"pending", "indexing", "generating"}:
        return _repo_response(repo)

    if not repo:
        repo = Repo(url=normalized_url, owner=parsed.owner, name=parsed.name, status="pending")
        db.add(repo)
        db.commit()
        db.refresh(repo)
    elif repo.status == "failed":
        repo.status = "pending"
        repo.error_message = None
        db.commit()

    background_tasks.add_task(_run_index_job, repo.id)
    db.refresh(repo)
    return _repo_response(repo)


@router.get("/repos/{repo_id}", response_model=RepoResponse)
def get_repo(repo_id: str, db: Session = Depends(get_db)) -> RepoResponse:
    repo = db.query(Repo).filter(Repo.id == repo_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    return _repo_response(repo)


@router.get("/repos/{repo_id}/topics", response_model=TopicListResponse)
def list_topics(
    repo_id: str,
    session_id: str | None = Depends(get_optional_session_id),
    db: Session = Depends(get_db),
) -> TopicListResponse:
    repo = db.query(Repo).filter(Repo.id == repo_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    if repo.status != "ready":
        raise HTTPException(status_code=409, detail=f"Repository is not ready. Current status: {repo.status}")

    topics = db.query(Topic).filter(Topic.repo_id == repo_id).order_by(Topic.order).all()
    summaries = []
    for topic in topics:
        progress = progress_for_topic(db, session_id, topic)
        summaries.append(_topic_summary(topic, progress))
    return TopicListResponse(repo_id=repo_id, topics=summaries)


@router.get("/topics/{topic_id}", response_model=TopicDetailResponse)
async def get_topic(
    topic_id: str,
    session_id: str | None = Depends(get_optional_session_id),
    db: Session = Depends(get_db),
) -> TopicDetailResponse:
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    content = await generator.ensure_topic_content(db, topic)
    progress = progress_for_topic(db, session_id, topic)
    return TopicDetailResponse(
        id=topic.id,
        title=topic.title,
        description=topic.description,
        order=topic.order,
        difficulty=topic.difficulty,
        estimated_minutes=topic.estimated_minutes,
        lesson=content.lesson,
        flashcards=[Flashcard(**card) for card in content.flashcards],
        file_refs=topic.file_refs,
        challenge_passed=bool(progress and progress.challenge_passed),
        quiz_passed=bool(progress and progress.quiz_passed),
        cleared=topic_cleared(progress),
    )


@router.get("/topics/{topic_id}/code", response_model=TopicCodeResponse)
async def get_topic_code(topic_id: str, db: Session = Depends(get_db)) -> TopicCodeResponse:
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    content = await generator.ensure_topic_content(db, topic)
    repo = db.query(Repo).filter(Repo.id == topic.repo_id).one()
    parsed = parse_github_url(repo.url)
    files = await generator.github.fetch_file_contents(parsed, topic.file_refs[:5])

    annotations_by_file: dict[str, list[CodeAnnotation]] = {}
    for item in content.annotations:
        annotation = CodeAnnotation(**item)
        annotations_by_file.setdefault(annotation.file_path, []).append(annotation)

    annotated_files = []
    for file in files:
        ext = file.path.split(".")[-1] if "." in file.path else "txt"
        annotated_files.append(
            AnnotatedFile(
                file_path=file.path,
                language=ext,
                content=file.content,
                annotations=annotations_by_file.get(file.path, []),
            )
        )

    return TopicCodeResponse(topic_id=topic_id, files=annotated_files)


@router.get("/topics/{topic_id}/challenge", response_model=ChallengeResponse)
async def get_challenge(topic_id: str, db: Session = Depends(get_db)) -> ChallengeResponse:
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    content = await generator.ensure_topic_content(db, topic)
    challenge = content.challenge
    starter_code = challenge.get("starter_code") or challenge.get("starterCode") or ""
    return ChallengeResponse(
        topic_id=topic_id,
        title=challenge.get("title") or topic.title,
        prompt=challenge.get("prompt") or "",
        starter_code=str(starter_code),
        supports_pseudocode=challenge.get("supports_pseudocode", True),
        examples=challenge.get("examples") or [],
    )


@router.post("/topics/{topic_id}/challenge/submit", response_model=ChallengeSubmitResponse)
async def submit_challenge(
    topic_id: str,
    payload: ChallengeSubmitRequest,
    session_id: str = Depends(require_session_id),
    db: Session = Depends(get_db),
) -> ChallengeSubmitResponse:
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    content = await generator.ensure_topic_content(db, topic)
    result = grader.grade_challenge(content.challenge, payload.submission, payload.mode)

    progress = get_or_create_progress(db, session_id, topic_id)
    progress.challenge_score = result["score"]
    if result["passed"]:
        progress.challenge_passed = True
    db.commit()
    db.refresh(progress)

    return ChallengeSubmitResponse(
        passed=result["passed"],
        score=result["score"],
        feedback=result["feedback"],
        cleared=topic_cleared(progress),
    )


@router.get("/topics/{topic_id}/quiz", response_model=QuizResponse)
async def get_quiz(topic_id: str, db: Session = Depends(get_db)) -> QuizResponse:
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    content = await generator.ensure_topic_content(db, topic)
    quiz = content.quiz
    questions = [
        QuizQuestion(
            id=str(q.get("id", f"q{i + 1}")),
            type=q.get("type", "multiple_choice"),
            question=q.get("question", ""),
            options=q.get("options"),
        )
        for i, q in enumerate(quiz.get("questions", []))
    ]
    return QuizResponse(topic_id=topic_id, title=quiz.get("title", topic.title), questions=questions)


@router.post("/topics/{topic_id}/quiz/submit", response_model=QuizSubmitResponse)
async def submit_quiz(
    topic_id: str,
    payload: QuizSubmitRequest,
    session_id: str = Depends(require_session_id),
    db: Session = Depends(get_db),
) -> QuizSubmitResponse:
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    content = await generator.ensure_topic_content(db, topic)
    result = grader.grade_quiz(content.quiz, payload.answers)

    progress = get_or_create_progress(db, session_id, topic_id)
    progress.quiz_score = result["score"]
    if result["passed"]:
        progress.quiz_passed = True
    db.commit()
    db.refresh(progress)

    return QuizSubmitResponse(
        passed=result["passed"],
        score=result["score"],
        feedback=result["feedback"],
        results=result["results"],
        cleared=topic_cleared(progress),
    )


@router.get("/progress", response_model=ProgressResponse)
def get_progress(
    session_id: str = Depends(require_session_id),
    db: Session = Depends(get_db),
) -> ProgressResponse:
    rows = (
        db.query(TopicProgress, Topic)
        .join(Topic, Topic.id == TopicProgress.topic_id)
        .filter(TopicProgress.session_id == session_id)
        .all()
    )
    entries = [
        ProgressEntry(
            topic_id=topic.id,
            topic_title=topic.title,
            repo_id=topic.repo_id,
            challenge_passed=progress.challenge_passed,
            quiz_passed=progress.quiz_passed,
            challenge_score=progress.challenge_score,
            quiz_score=progress.quiz_score,
            cleared=topic_cleared(progress),
        )
        for progress, topic in rows
    ]
    return ProgressResponse(session_id=session_id, entries=entries)
