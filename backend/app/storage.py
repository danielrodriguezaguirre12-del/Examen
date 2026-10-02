"""Almacenamiento de archivos: Amazon S3 en producción, disco local en desarrollo.

En EC2 boto3 toma las credenciales automáticamente del IAM Role de la instancia,
por eso no hay ninguna clave en el código.
"""
import os
import shutil
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

from .config import (
    AWS_REGION,
    MAX_THUMBNAIL_MB,
    MAX_VIDEO_MB,
    PUBLIC_BASE_URL,
    S3_THUMBNAILS_BUCKET,
    S3_VIDEOS_BUCKET,
    STORAGE_MODE,
)

LOCAL_MEDIA_DIR = Path(__file__).resolve().parent.parent / "uploads"

VIDEO_EXTENSIONS = {".mp4": "video/mp4"}
THUMBNAIL_EXTENSIONS = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png"}

_s3 = None


def _s3_client():
    global _s3
    if _s3 is None:
        import boto3

        _s3 = boto3.client("s3", region_name=AWS_REGION)
    return _s3


def _file_size(file: UploadFile) -> int:
    if file.size is not None:
        return file.size
    file.file.seek(0, os.SEEK_END)
    size = file.file.tell()
    file.file.seek(0)
    return size


def _validate(file: UploadFile, allowed: dict[str, str], max_mb: int, label: str) -> str:
    ext = Path(file.filename or "").suffix.lower()
    if ext not in allowed:
        formatos = ", ".join(e.lstrip(".").upper() for e in allowed)
        raise HTTPException(400, f"Formato de {label} no permitido. Use: {formatos}")
    if _file_size(file) > max_mb * 1024 * 1024:
        raise HTTPException(413, f"El {label} supera el máximo de {max_mb} MB")
    return ext


def _save(file: UploadFile, kind: str, bucket: str, ext: str, content_type: str) -> tuple[str, str]:
    """Guarda el archivo y devuelve (key, url_publica)."""
    key = f"{uuid.uuid4().hex}{ext}"
    if STORAGE_MODE == "s3":
        _s3_client().upload_fileobj(
            file.file, bucket, key, ExtraArgs={"ContentType": content_type}
        )
        return key, f"https://{bucket}.s3.{AWS_REGION}.amazonaws.com/{key}"

    folder = LOCAL_MEDIA_DIR / kind
    folder.mkdir(parents=True, exist_ok=True)
    with open(folder / key, "wb") as out:
        shutil.copyfileobj(file.file, out)
    return key, f"{PUBLIC_BASE_URL}/media/{kind}/{key}"


def save_video(file: UploadFile) -> tuple[str, str]:
    ext = _validate(file, VIDEO_EXTENSIONS, MAX_VIDEO_MB, "video")
    return _save(file, "videos", S3_VIDEOS_BUCKET, ext, VIDEO_EXTENSIONS[ext])


def save_thumbnail(file: UploadFile) -> tuple[str, str]:
    ext = _validate(file, THUMBNAIL_EXTENSIONS, MAX_THUMBNAIL_MB, "miniatura")
    return _save(file, "thumbnails", S3_THUMBNAILS_BUCKET, ext, THUMBNAIL_EXTENSIONS[ext])


def _delete(kind: str, bucket: str, key: str) -> None:
    if STORAGE_MODE == "s3":
        _s3_client().delete_object(Bucket=bucket, Key=key)
    else:
        (LOCAL_MEDIA_DIR / kind / key).unlink(missing_ok=True)


def delete_video(key: str) -> None:
    _delete("videos", S3_VIDEOS_BUCKET, key)


def delete_thumbnail(key: str) -> None:
    _delete("thumbnails", S3_THUMBNAILS_BUCKET, key)
