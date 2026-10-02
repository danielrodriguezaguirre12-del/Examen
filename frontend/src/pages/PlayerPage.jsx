import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import VideoCard from '../components/VideoCard'
import { formatDate, formatViews } from '../utils'

export default function PlayerPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [video, setVideo] = useState(null)
  const [comments, setComments] = useState([])
  const [recommended, setRecommended] = useState([])
  const [newComment, setNewComment] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setVideo(null)
    setError('')
    window.scrollTo(0, 0)
    api.getVideo(id).then(setVideo).catch((e) => setError(e.message))
    api.listComments(id).then(setComments).catch(() => setComments([]))
    api.recommended(id).then(setRecommended).catch(() => setRecommended([]))
  }, [id])

  const sendComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    try {
      const c = await api.addComment(id, newComment.trim())
      setComments([c, ...comments])
      setNewComment('')
    } catch (err) {
      setError(err.message)
    }
  }

  if (error && !video) return <p className="error">{error}</p>
  if (!video) return <p className="muted">Cargando…</p>

  return (
    <div className="player-layout">
      <section>
        <video key={video.id} className="player" src={video.video_url} poster={video.thumbnail_url} controls autoPlay />
        <h1 className="player-title">{video.title}</h1>
        <div className="player-meta">
          <span className="nav-user">
            <span className="avatar">{video.user_name[0]?.toUpperCase()}</span>
            {video.user_name}
          </span>
          <span className="muted">
            {formatViews(video.views)} · {formatDate(video.created_at)}
          </span>
        </div>
        {video.description && <p className="card description">{video.description}</p>}

        <h2>{comments.length} comentarios</h2>
        {user && (
          <form className="comment-form" onSubmit={sendComment}>
            <span className="avatar">{user.name[0]?.toUpperCase()}</span>
            <input
              placeholder="Agrega un comentario…"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={2000}
            />
            <button className="btn btn-primary" disabled={!newComment.trim()}>
              Comentar
            </button>
          </form>
        )}
        {error && <p className="error">{error}</p>}
        <ul className="comments">
          {comments.map((c) => (
            <li key={c.id}>
              <span className="avatar">{c.user_name[0]?.toUpperCase()}</span>
              <div>
                <strong>{c.user_name}</strong> <span className="muted small">{formatDate(c.created_at)}</span>
                <p>{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <aside>
        <h2>Recomendados</h2>
        {recommended.length === 0 && <p className="muted">No hay más videos.</p>}
        <div className="recommended">
          {recommended.map((v) => (
            <VideoCard key={v.id} video={v} compact />
          ))}
        </div>
      </aside>
    </div>
  )
}
