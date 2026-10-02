from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import storage
from ..auth import get_current_user
from ..database import get_db
from ..models import User, Video
from ..schemas import VideoOut

router = APIRouter(prefix="/videos", tags=["Videos"])


def _get_video(db: Session, video_id: int) -> Video:
    video = db.get(Video, video_id)
    if video is None:
        raise HTTPException(404, "Video no encontrado")
    return video


def _get_own_video(db: Session, video_id: int, user: User) -> Video:
    video = _get_video(db, video_id)
    if video.user_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Solo el autor puede modificar este video")
    return video


@router.post("", response_model=VideoOut, status_code=status.HTTP_201_CREATED)
def create_video(
    title: str = Form(..., min_length=1, max_length=200),
    description: str = Form(""),
    video: UploadFile = File(..., description="Archivo MP4 (máx. 100 MB)"),
    thumbnail: UploadFile = File(..., description="Imagen JPG, JPEG o PNG"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    video_key, video_url = storage.save_video(video)
    try:
        thumb_key, thumb_url = storage.save_thumbnail(thumbnail)
    except Exception:
        storage.delete_video(video_key)
        raise

    item = Video(
        title=title.strip(),
        description=description.strip(),
        video_url=video_url,
        video_key=video_key,
        thumbnail_url=thumb_url,
        thumbnail_key=thumb_key,
        user_id=user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("", response_model=list[VideoOut])
def list_videos(
    user_id: int | None = Query(None, description="Filtrar por autor"),
    q: str | None = Query(None, description="Buscar por título"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    stmt = select(Video).order_by(Video.created_at.desc())
    if user_id is not None:
        stmt = stmt.where(Video.user_id == user_id)
    if q:
        stmt = stmt.where(Video.title.ilike(f"%{q}%"))
    return db.scalars(stmt.offset(skip).limit(limit)).all()


@router.get("/{video_id}", response_model=VideoOut)
def get_video(video_id: int, db: Session = Depends(get_db)):
    video = _get_video(db, video_id)
    video.views += 1
    db.commit()
    db.refresh(video)
    return video


@router.get("/{video_id}/recommended", response_model=list[VideoOut])
def recommended(video_id: int, limit: int = Query(8, ge=1, le=20), db: Session = Depends(get_db)):
    """Videos recomendados: otros videos de la plataforma en orden aleatorio."""
    stmt = select(Video).where(Video.id != video_id).order_by(func.random()).limit(limit)
    return db.scalars(stmt).all()


@router.put("/{video_id}", response_model=VideoOut)
def update_video(
    video_id: int,
    title: str | None = Form(None, max_length=200),
    description: str | None = Form(None),
    thumbnail: UploadFile | None = File(None, description="Nueva miniatura (opcional)"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    video = _get_own_video(db, video_id, user)
    if title is not None and title.strip():
        video.title = title.strip()
    if description is not None:
        video.description = description.strip()
    if thumbnail is not None and thumbnail.filename:
        old_key = video.thumbnail_key
        video.thumbnail_key, video.thumbnail_url = storage.save_thumbnail(thumbnail)
        storage.delete_thumbnail(old_key)
    db.commit()
    db.refresh(video)
    return video


@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_video(video_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    video = _get_own_video(db, video_id, user)
    video_key, thumb_key = video.video_key, video.thumbnail_key
    db.delete(video)
    db.commit()
    storage.delete_video(video_key)
    storage.delete_thumbnail(thumb_key)
