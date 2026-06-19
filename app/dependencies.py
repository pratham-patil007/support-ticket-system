from fastapi import Header, HTTPException
from app.auth import verify_token
from app.database import SessionLocal
from app.models import User

def get_current_user(
    authorization: str = Header(None)
):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Token missing"
        )

    try:
        parts = authorization.split(" ")
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise HTTPException(
                status_code=401,
                detail="Invalid token format"
            )
        token = parts[1]
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid token format"
        )

    payload = verify_token(token)

    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    email = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=401,
            detail="Invalid token payload"
        )

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(
                status_code=401,
                detail="User not found"
            )
        return user
    finally:
        db.close()