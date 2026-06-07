import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class Repo(Base):
    __tablename__ = "repos"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    url: Mapped[str] = mapped_column(String(512), unique=True, index=True)
    owner: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(255))
    default_branch: Mapped[str] = mapped_column(String(100), default="main")
    commit_sha: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="pending")
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    language_mix: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    file_tree: Mapped[list | None] = mapped_column(JSON, nullable=True)
    indexed_files: Mapped[list | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    topics: Mapped[list["Topic"]] = relationship(back_populates="repo", cascade="all, delete-orphan")


class Topic(Base):
    __tablename__ = "topics"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    repo_id: Mapped[str] = mapped_column(String(36), ForeignKey("repos.id"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    order: Mapped[int] = mapped_column(Integer, default=0)
    difficulty: Mapped[str] = mapped_column(String(32), default="beginner")
    estimated_minutes: Mapped[int] = mapped_column(Integer, default=20)
    file_refs: Mapped[list] = mapped_column(JSON, default=list)
    content_status: Mapped[str] = mapped_column(String(32), default="pending")

    repo: Mapped["Repo"] = relationship(back_populates="topics")
    content: Mapped["TopicContent | None"] = relationship(
        back_populates="topic", cascade="all, delete-orphan", uselist=False
    )


class TopicContent(Base):
    __tablename__ = "topic_contents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    topic_id: Mapped[str] = mapped_column(String(36), ForeignKey("topics.id"), unique=True)
    lesson: Mapped[str] = mapped_column(Text)
    flashcards: Mapped[list] = mapped_column(JSON, default=list)
    annotations: Mapped[list] = mapped_column(JSON, default=list)
    challenge: Mapped[dict] = mapped_column(JSON, default=dict)
    quiz: Mapped[dict] = mapped_column(JSON, default=dict)

    topic: Mapped["Topic"] = relationship(back_populates="content")


class AnonymousSession(Base):
    __tablename__ = "anonymous_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    progress: Mapped[list["TopicProgress"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )


class TopicProgress(Base):
    __tablename__ = "topic_progress"
    __table_args__ = (UniqueConstraint("session_id", "topic_id", name="uq_session_topic"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("anonymous_sessions.id"), index=True)
    topic_id: Mapped[str] = mapped_column(String(36), ForeignKey("topics.id"), index=True)
    challenge_passed: Mapped[bool] = mapped_column(Boolean, default=False)
    quiz_passed: Mapped[bool] = mapped_column(Boolean, default=False)
    challenge_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    quiz_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    session: Mapped["AnonymousSession"] = relationship(back_populates="progress")
