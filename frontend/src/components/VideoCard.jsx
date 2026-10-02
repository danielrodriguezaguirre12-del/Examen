import { Link } from 'react-router-dom'
import { formatDate, formatViews } from '../utils'

export default function VideoCard({ video, compact = false }) {
  return (
    <Link to={`/video/${video.id}`} className={compact ? 'video-card compact' : 'video-card'}>
      <div className="thumb">
        <img src={video.thumbnail_url} alt={video.title} loading="lazy" />
      </div>
      <div className="video-info">
        <h3 className="video-title">{video.title}</h3>
        <p className="muted">{video.user_name}</p>
        <p className="muted">
          {formatViews(video.views)} · {formatDate(video.created_at)}
        </p>
      </div>
    </Link>
  )
}
