const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

async function request(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed: ${res.status}`)
  }
  return res.json()
}

export const api = {
  baseUrl: BASE_URL,
  // Auth
  async login({ email, name, role }) {
    return request('/auth/login', { method: 'POST', body: { email, name, role } })
  },
  async me(token) {
    const url = new URL(`${BASE_URL}/me`)
    url.searchParams.set('token', token)
    const res = await fetch(url.toString())
    if (!res.ok) throw new Error('Unauthorized')
    return res.json()
  },
  // Courts
  async listCourts() { return request('/courts') },
  async createCourt(data, token) {
    const url = new URL(`${BASE_URL}/admin/courts`)
    url.searchParams.set('token', token)
    const res = await fetch(url.toString(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  // Bookings
  async createBooking(data, token) {
    const url = new URL(`${BASE_URL}/bookings`)
    url.searchParams.set('token', token)
    const res = await fetch(url.toString(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async myBookings(token) {
    const url = new URL(`${BASE_URL}/my/bookings`)
    url.searchParams.set('token', token)
    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  // Tournaments
  async listTournaments() { return request('/tournaments') },
  async createTournament(data, token) {
    const url = new URL(`${BASE_URL}/admin/tournaments`)
    url.searchParams.set('token', token)
    const res = await fetch(url.toString(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  // Leaderboard & players
  async leaderboard({ level, limit } = {}) {
    const url = new URL(`${BASE_URL}/leaderboard`)
    if (level) url.searchParams.set('level', level)
    if (limit) url.searchParams.set('limit', String(limit))
    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async players({ q, level, limit } = {}) {
    const url = new URL(`${BASE_URL}/players`)
    if (q) url.searchParams.set('q', q)
    if (level) url.searchParams.set('level', level)
    if (limit) url.searchParams.set('limit', String(limit))
    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  // AI chat
  async aiChat({ role = 'coach', message, context }, token) {
    return request('/ai/chat', { method: 'POST', body: { role, message, context, token } })
  }
}
