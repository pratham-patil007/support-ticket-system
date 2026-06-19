from fastapi import APIRouter
from sqlalchemy.orm import Session
from app.auth import hash_password
from app.schemas import UserCreate
from app.database import SessionLocal
from app.models import User
from app.schemas import UserLogin
from app.auth import verify_password, create_access_token

router = APIRouter()

@router.post("/register")
def register(user: UserCreate):

    db: Session = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.email == user.email).first()
        if existing_user:
            return {"message": "Email already registered"}

        role = user.role if user.role in ["customer", "admin"] else "customer"

        new_user = User(
            name=user.name,
            email=user.email,
            password=hash_password(user.password),
            role=role
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {
            "message": "User registered",
            "id": new_user.id
        }
    finally:
        db.close()
    
@router.post("/login")
def login(user: UserLogin):

    db = SessionLocal()
    try:
        existing_user = db.query(User).filter(
            User.email == user.email
        ).first()

        if not existing_user:
            return {"message": "Invalid email"}

        if not verify_password(
            user.password,
            existing_user.password
        ):
            return {"message": "Invalid password"}

        token = create_access_token(
            {"sub": existing_user.email}
        )

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": existing_user.id,
                "name": existing_user.name,
                "email": existing_user.email,
                "role": existing_user.role
            }
        }
    finally:
        db.close()
    
from fastapi import Depends
from app.dependencies import get_current_user

@router.get("/me")
def me(user=Depends(get_current_user)):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role
    }