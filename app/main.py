from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from app.database import engine
from app.models import Base
from app.routes import auth_routes, ticket_routes

# Create all DB tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SupportDesk API",
    description="Role-based support ticket management system",
    version="2.0.0"
)

# CORS — allow all origins (lock down to specific domain in production if needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes
app.include_router(ticket_routes.router)
app.include_router(auth_routes.router)

@app.get("/")
def home():
    return {"message": "SupportDesk API v2.0 — Running"}