from fastapi import FastAPI
from app.database import engine
from app.models import Base
from app.routes import auth_routes
from app.models import User, Ticket
from app.routes import ticket_routes
Base.metadata.create_all(bind=engine)

app = FastAPI()
from fastapi.middleware.cors import CORSMiddleware
app.include_router(ticket_routes.router)
app.include_router(auth_routes.router)

@app.get("/")
def home():
    return {"message": "API Running"}

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)