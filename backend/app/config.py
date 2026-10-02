import os

from dotenv import load_dotenv

load_dotenv()

# Base de datos: en local usa SQLite; en AWS apunta a RDS (PostgreSQL)
# Ejemplo RDS: postgresql+psycopg2://usuario:clave@mi-db.xxxx.us-east-1.rds.amazonaws.com:5432/videos
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./local.db")

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-cambiar-en-produccion")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))

# "s3" en EC2 (usa el IAM Role de la instancia), "local" para desarrollo
STORAGE_MODE = os.getenv("STORAGE_MODE", "local").lower()
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_VIDEOS_BUCKET = os.getenv("S3_VIDEOS_BUCKET", "")
S3_THUMBNAILS_BUCKET = os.getenv("S3_THUMBNAILS_BUCKET", "")

# URL pública de la API (solo se usa para construir URLs en modo local)
PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "http://localhost:8000").rstrip("/")

CORS_ORIGINS = [
    o.strip()
    for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if o.strip()
]

MAX_VIDEO_MB = int(os.getenv("MAX_VIDEO_MB", "100"))
MAX_THUMBNAIL_MB = int(os.getenv("MAX_THUMBNAIL_MB", "5"))
