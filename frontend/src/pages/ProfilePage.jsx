import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { formatDate, formatViews } from '../utils'

const MAX_VIDEO_MB = 100

function UploadForm({ onUploaded }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoFile, setVideoFile] = useState(null)
  const [thumbFile, setThumbFile] = useState(null)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState('')
  const [formKey, setFormKey] = useState(0)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!videoFile || !thumbFile) return setError('Selecciona el video y la miniatura')
    if (videoFile.size > MAX_VIDEO_MB * 1024 * 1024) return setError(`El video supera ${MAX_VIDEO_MB} MB`)

    const form = new FormData()
    form.append('title', title)
    form.append('description', description)
    form.append('video', videoFile)
    form.append('thumbnail', thumbFile)
    try {
      setProgress(0)
      await api.createVideo(form, setProgress)
      setTitle('')
      setDescription('')
      setVideoFile(null)
      setThumbFile(null)
      setFormKey((k) => k + 1) // limpia los <input type="file">
      onUploaded()
    } catch (err) {
      setError(err.message)
    } finally {
      setProgress(null)
    }
  }

  return (
    <form key={formKey} className="card upload-form" onSubmit={submit}>
      <h2>Publicar video</h2>
      <label>
        Título
        <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
      </label>
      <label>
        Descripción
        <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <div className="file-row">
        <label>
          Video (MP4, máx. {MAX_VIDEO_MB} MB)
          <input type="file" accept="video/mp4,.mp4" onChange={(e) => setVideoFile(e.target.files[0])} required />
        </label>
        <label>
          Miniatura (JPG, JPEG, PNG)
          <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={(e) => setThumbFile(e.target.files[0])} required />
        </label>
      </div>
      {error && <p className="error">{error}</p>}
      {progress !== null && (
        <div className="progress">
          <div style={{ width: `${progress}%` }} />
          <span>{progress < 100 ? `Subiendo ${progress}%` : 'Procesando…'}</span>
        </div>
      )}
      <button className="btn btn-primary" disabled={progress !== null}>
        Publicar
      </button>
    </form>
  )
}

function MyVideoRow({ video, onChanged }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(video.title)
  const [description, setDescription] = useState(video.description)
  const [thumb, setThumb] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const form = new FormData()
    form.append('title', title)
    form.append('description', description)
    if (thumb) form.append('thumbnail', thumb)
    try {
      await api.updateVideo(video.id, form)
      setEditing(false)
      onChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!confirm(`¿Eliminar "${video.title}"? Esta acción no se puede deshacer.`)) return
    setBusy(true)
    try {
      await api.deleteVideo(video.id)
      onChanged()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <li className="card my-video">
      <Link to={`/video/${video.id}`} className="thumb small-thumb">
        <img src={video.thumbnail_url} alt={video.title} />
      </Link>
      <div className="my-video-body">
        {editing ? (
          <form onSubmit={save} className="edit-form">
            <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            <label className="small">
              Cambiar miniatura (opcional)
              <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={(e) => setThumb(e.target.files[0])} />
            </label>
            <div className="row">
              <button className="btn btn-primary" disabled={busy}>Guardar</button>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>Cancelar</button>
            </div>
          </form>
        ) : (
          <>
            <h3 className="video-title">{video.title}</h3>
            <p className="muted small">
              {formatViews(video.views)} · {formatDate(video.created_at)}
            </p>
            <p className="small clamp">{video.description}</p>
            <div className="row">
              <button className="btn" onClick={() => setEditing(true)} disabled={busy}>Editar</button>
              <button className="btn btn-danger" onClick={remove} disabled={busy}>Eliminar</button>
            </div>
          </>
        )}
        {error && <p className="error">{error}</p>}
      </div>
    </li>
  )
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [videos, setVideos] = useState([])
  const [error, setError] = useState('')

  const load = useCallback(() => {
    api.getUser(user.id).then(setProfile).catch((e) => setError(e.message))
    api.listVideos({ user_id: user.id, limit: 100 }).then(setVideos).catch((e) => setError(e.message))
  }, [user.id])

  useEffect(load, [load])

  return (
    <>
      <section className="card profile-header">
        <span className="avatar big">{user.name[0]?.toUpperCase()}</span>
        <div>
          <h1>{profile?.name ?? user.name}</h1>
          <p className="muted">{profile?.email ?? user.email}</p>
          {profile && (
            <p className="muted small">
              {profile.video_count} {profile.video_count === 1 ? 'video publicado' : 'videos publicados'} · Miembro
              desde {formatDate(profile.created_at)}
            </p>
          )}
        </div>
      </section>

      {error && <p className="error">{error}</p>}

      <UploadForm onUploaded={load} />

      <h2>Mis videos</h2>
      {videos.length === 0 ? (
        <p className="muted">Aún no has publicado videos.</p>
      ) : (
        <ul className="my-videos">
          {videos.map((v) => (
            <MyVideoRow key={`${v.id}-${v.thumbnail_url}-${v.title}`} video={v} onChanged={load} />
          ))}
        </ul>
      )}
    </>
  )
}
