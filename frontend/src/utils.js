export function formatViews(n) {
  const v = Number(n) || 0
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace('.0', '')} M vistas`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace('.0', '')} K vistas`
  return `${v} ${v === 1 ? 'vista' : 'vistas'}`
}

export function formatDate(iso) {
  // La API devuelve fechas UTC; SQLite las devuelve sin zona horaria
  const date = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`)
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
}
