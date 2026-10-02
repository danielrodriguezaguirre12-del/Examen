import { useEffect, useState } from 'react'
import { api } from '../api'
import VideoCard from '../components/VideoCard'

export default function HomePage() {
  const [videos, setVideos] = useState([])
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    api
      .listVideos({ q: search })
      .then(setVideos)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [search])

  return (
    <>
      <form
        className="search-bar"
        onSubmit={(e) => {
          e.preventDefault()
          setSearch(query.trim())
        }}
      >
        <input placeholder="Buscar videos…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button className="btn">Buscar</button>
      </form>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className="muted">Cargando videos…</p>
      ) : videos.length === 0 ? (
        <p className="muted">No hay videos todavía. ¡Publica el primero desde tu perfil!</p>
      ) : (
        <div className="video-grid">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      )}
    </>
  )
}
