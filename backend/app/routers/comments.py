from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Comment, User, Video
from ..schemas import CommentCreate, CommentOut

router = APIRouter(prefix="/videos/{video_id}/comments", tags=["Comentarios"])


@router.post("", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def add_comment(
    video_id: int,
    data: CommentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if db.get(Video, video_id) is None:
        raise HTTPException(404, "Video no encontrado")
    comment = Comment(content=data.content.strip(), user_id=user.id, video_id=video_id)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.get("", response_model=list[CommentOut])
def list_comments(video_id: int, db: Session = Depends(get_db)):
    if db.get(Video, video_id) is None:
        raise HTTPException(404, "Video no encontrado")
    stmt = select(Comment).where(Comment.video_id == video_id).order_by(Comment.created_at.desc())
    return db.scalars(stmt).all()
