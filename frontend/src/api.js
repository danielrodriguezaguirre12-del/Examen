const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

const TOKEN_KEY = 'vt_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY))

function errorMessage(data, status) {
  if (!data) return `Error ${status}`
  if (typeof data.detail === 'string') return data.detail
  if (Array.isArray(data.detail)) return data.detail.map((d) => d.msg).join('. ')
  return `Error ${status}`
}

async function request(path, { method = 'GET', json, form } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  let body
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(json)
  } else if (form) {
    body = form
  }
  const res = await fetch(`${API_URL}${path}`, { method, headers, body })
  if (res.status === 204) return null
  if (res.status === 401 && token) {
    // Token vencido o inválido: cerrar sesión y volver al login
    setToken(null)
    localStorage.removeItem('vt_user')
    window.location.hash = '#/login'
    window.location.reload()
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(errorMessage(data, res.status))
  return data
}

// Usa XMLHttpRequest para poder mostrar el progreso de subida del video
function uploadWithProgress(path, form, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_URL}${path}`)
    const token = getToken()
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      let data = null
      try {
        data = JSON.parse(xhr.responseText)
      } catch {
        /* respuesta vacía */
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data)
      else reject(new Error(errorMessage(data, xhr.status)))
    }
    xhr.onerror = () => reject(new Error('No se pudo conectar con la API'))
    xhr.send(form)
  })
}

export const api = {
  register: (name, email, password) => request('/users', { method: 'POST', json: { name, email, password } }),
  login: (email, password) => request('/login', { method: 'POST', json: { email, password } }),
  getUser: (id) => request(`/users/${id}`),

  listVideos: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
    return request(`/videos${qs.toString() ? `?${qs}` : ''}`)
  },
  getVideo: (id) => request(`/videos/${id}`),
  recommended: (id) => request(`/videos/${id}/recommended`),
  createVideo: (form, onProgress) => uploadWithProgress('/videos', form, onProgress),
  updateVideo: (id, form) => request(`/videos/${id}`, { method: 'PUT', form }),
  deleteVideo: (id) => request(`/videos/${id}`, { method: 'DELETE' }),

  listComments: (id) => request(`/videos/${id}/comments`),
  addComment: (id, content) => request(`/videos/${id}/comments`, { method: 'POST', json: { content } }),
}
