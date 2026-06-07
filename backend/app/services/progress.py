from sqlalchemy.orm import Session

from app.models import Topic, TopicProgress


def get_or_create_progress(db: Session, session_id: str, topic_id: str) -> TopicProgress:
    progress = (
        db.query(TopicProgress)
        .filter(TopicProgress.session_id == session_id, TopicProgress.topic_id == topic_id)
        .first()
    )
    if progress:
        return progress
    progress = TopicProgress(session_id=session_id, topic_id=topic_id)
    db.add(progress)
    db.commit()
    db.refresh(progress)
    return progress


def topic_cleared(progress: TopicProgress | None) -> bool:
    if not progress:
        return False
    return progress.challenge_passed and progress.quiz_passed


def progress_for_topic(db: Session, session_id: str | None, topic: Topic) -> TopicProgress | None:
    if not session_id:
        return None
    return (
        db.query(TopicProgress)
        .filter(TopicProgress.session_id == session_id, TopicProgress.topic_id == topic.id)
        .first()
    )
