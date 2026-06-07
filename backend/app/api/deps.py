from fastapi import Header, HTTPException

from app.models import AnonymousSession
from app.database import SessionLocal


def get_optional_session_id(x_session_id: str | None = Header(default=None)) -> str | None:
    return x_session_id


def require_session_id(x_session_id: str | None = Header(default=None)) -> str:
    if not x_session_id:
        raise HTTPException(status_code=401, detail="X-Session-Id header is required")
    db = SessionLocal()
    try:
        session = db.query(AnonymousSession).filter(AnonymousSession.id == x_session_id).first()
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session")
        return x_session_id
    finally:
        db.close()
