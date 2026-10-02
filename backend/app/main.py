from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from . import models  # noqa: F401  (registra las tablas)
from .config import CORS_ORIGINS, STORAGE_MODE
from .database import Base, engine
from .routers import comments, users, videos
from .storage import LOCAL_MEDIA_DIR

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Plataforma de Videos API",
    description="API REST para la plataforma de videos (React + FastAPI + AWS S3/EC2/RDS)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(videos.router)
app.include_router(comments.router)

if STORAGE_MODE != "s3":
    LOCAL_MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    app.mount("/media", StaticFiles(directory=LOCAL_MEDIA_DIR), name="media")


@app.get("/", tags=["Estado"])
def health():
    return {"status": "ok", "docs": "/docs", "storage": STORAGE_MODE}
