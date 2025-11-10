import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import { Home, Calendar, Trophy, User, Bot, Settings, Users, Layers } from 'lucide-react'
import { api } from './lib/api'
import './index.css'

function useAuth() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [me, setMe] = useState(null)

  useEffect(() => {
    if (!token) return
    api.me(token).then(setMe).catch(() => setMe(null))
  }, [token])

  const login = async (email, name, role) => {
    const res = await api.login({ email, name, role })
    setToken(res.token)
    localStorage.setItem('token', res.token)
    const profile = await api.me(res.token)
    setMe(profile)
  }
  const logout = () => {
    setToken(''); localStorage.removeItem('token'); setMe(null)
  }
  return { token, me, login, logout }
}

function Shell({ me, onLogout, children }) {
  const isAdmin = me?.role === 'admin'
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-sky-50">
      <header className="sticky top-0 z-20 backdrop-blur bg-white/70 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/" className="font-semibold text-indigo-700">Tennis Club</Link>
          <nav className="hidden md:flex gap-4 text-sm">
            <Link to="/book" className="hover:text-indigo-700">Book</Link>
            <Link to="/tournaments" className="hover:text-indigo-700">Tournaments</Link>
            <Link to="/leaderboard" className="hover:text-indigo-700">Leaderboard</Link>
            <Link to="/players" className="hover:text-indigo-700">Players</Link>
            <Link to="/ai" className="hover:text-indigo-700">AI Coach</Link>
            {isAdmin && <Link to="/admin" className="text-rose-600 font-medium">Admin</Link>}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {me ? (
              <>
                <span className="text-sm text-gray-700">{me.name} · {me.role}</span>
                <button onClick={onLogout} className="text-xs px-3 py-1 rounded bg-gray-900 text-white">Logout</button>
              </>
            ) : (
              <Link to="/login" className="text-xs px-3 py-1 rounded bg-indigo-600 text-white">Login</Link>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('player@example.com')
  const [name, setName] = useState('Player One')
  const [role, setRole] = useState('player')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault(); setLoading(true)
    try { await onLogin(email, name, role); navigate('/') } finally { setLoading(false) }
  }
  return (
    <div className="grid md:grid-cols-2 gap-8 items-center">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">Welcome to the Tennis Club</h1>
        <p className="text-gray-600">Sign in as Player or Admin to continue.</p>
      </div>
      <form onSubmit={submit} className="bg-white/80 backdrop-blur p-6 rounded-xl shadow space-y-4">
        <div>
          <label className="text-sm font-medium">Email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="you@example.com" />
        </div>
        <div>
          <label className="text-sm font-medium">Name</label>
          <input value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium">Role</label>
          <select value={role} onChange={e=>setRole(e.target.value)} className="mt-1 w-full border rounded px-3 py-2">
            <option value="player">Player</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded px-4 py-2">
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}

function Bookings({ token }) {
  const [courts, setCourts] = useState([])
  const [mine, setMine] = useState([])
  const [when, setWhen] = useState(() => new Date().toISOString().slice(0,16))
  const [duration, setDuration] = useState(60)
  const [courtId, setCourtId] = useState('')
  useEffect(()=>{ api.listCourts().then(setCourts) },[])
  useEffect(()=>{ if(token) api.myBookings(token).then(setMine) },[token])
  const create = async () => {
    const start = new Date(when)
    const end = new Date(start.getTime() + duration*60000)
    await api.createBooking({ court_id: courtId || courts[0]?._id, start_time: start, end_time: end }, token)
    const next = await api.myBookings(token); setMine(next)
  }
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Book a Court</h2>
        <div className="grid grid-cols-2 gap-3">
          <select value={courtId} onChange={e=>setCourtId(e.target.value)} className="border rounded px-3 py-2 col-span-2">
            {courts.map(c=> <option key={c._id} value={c._id}>{c.name} · {c.surface}</option>)}
          </select>
          <input type="datetime-local" value={when} onChange={e=>setWhen(e.target.value)} className="border rounded px-3 py-2" />
          <select value={duration} onChange={e=>setDuration(parseInt(e.target.value))} className="border rounded px-3 py-2">
            <option value={60}>60 min</option>
            <option value={90}>90 min</option>
            <option value={120}>120 min</option>
          </select>
        </div>
        <button onClick={create} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded px-4 py-2">Reserve</button>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">My Bookings</h2>
        <ul className="space-y-2">
          {mine.map(b => (
            <li key={b._id} className="bg-white rounded border px-4 py-3">
              <div className="text-sm text-gray-700">Court {b.court_id}</div>
              <div className="text-xs text-gray-500">{new Date(b.start_time).toLocaleString()} - {new Date(b.end_time).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Tournaments() {
  const [items, setItems] = useState([])
  useEffect(()=>{ api.listTournaments().then(setItems) },[])
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Tournaments</h2>
      <ul className="grid md:grid-cols-2 gap-4">
        {items.map(t => (
          <li key={t._id} className="bg-white border rounded p-4">
            <div className="font-medium">{t.title}</div>
            <div className="text-xs text-gray-500">{new Date(t.start_date).toLocaleDateString()} - {new Date(t.end_date).toLocaleDateString()}</div>
            <p className="text-gray-600 text-sm mt-1">{t.description}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Leaderboard() {
  const [level, setLevel] = useState('')
  const [rows, setRows] = useState([])
  useEffect(()=>{ api.leaderboard({ level: level || undefined }).then(setRows) },[level])
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">Leaderboard</h2>
        <select value={level} onChange={e=>setLevel(e.target.value)} className="border rounded px-3 py-2 text-sm">
          <option value="">All levels</option>
          <option>beginner</option>
          <option>intermediate</option>
          <option>advanced</option>
          <option>pro</option>
        </select>
      </div>
      <ul className="divide-y bg-white rounded border">
        {rows.map((p,i)=> (
          <li key={p._id} className="flex items-center justify-between px-4 py-3">
            <span className="text-gray-700">{i+1}. {p.name} · {p.level}</span>
            <span className="font-semibold">{p.rating}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Players() {
  const [q, setQ] = useState('')
  const [rows, setRows] = useState([])
  useEffect(()=>{ api.players({ q: q || undefined }).then(setRows) },[q])
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">Players</h2>
        <input placeholder="Search players" value={q} onChange={e=>setQ(e.target.value)} className="border rounded px-3 py-2" />
      </div>
      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map(p => (
          <li key={p._id} className="bg-white rounded border p-4">
            <div className="font-medium">{p.name}</div>
            <div className="text-xs text-gray-500">{p.level} · {p.rating}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function AIAssistant() {
  const [role, setRole] = useState('coach')
  const [message, setMessage] = useState('What drills improve my backhand?')
  const [answer, setAnswer] = useState('')
  const ask = async () => {
    const res = await api.aiChat({ role, message })
    setAnswer(res.answer)
  }
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">AI Assistant</h2>
      <div className="grid sm:grid-cols-3 gap-3">
        <select value={role} onChange={e=>setRole(e.target.value)} className="border rounded px-3 py-2">
          <option value="coach">Tennis Coach</option>
          <option value="club">Club Assistant</option>
        </select>
        <input value={message} onChange={e=>setMessage(e.target.value)} className="border rounded px-3 py-2 sm:col-span-2" />
      </div>
      <button onClick={ask} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded px-4 py-2">Ask</button>
      {answer && <p className="bg-white border rounded p-4 text-gray-800">{answer}</p>}
    </div>
  )
}

function Admin({ token }) {
  const [name, setName] = useState('Court 1')
  const [surface, setSurface] = useState('hard')
  const [indoor, setIndoor] = useState(false)
  const [courts, setCourts] = useState([])
  const load = ()=> api.listCourts().then(setCourts)
  useEffect(load,[])
  const create = async () => { await api.createCourt({ name, surface, indoor }, token); load() }
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Admin Dashboard</h2>
      <div className="bg-white rounded border p-4 space-y-3">
        <div className="font-medium">Manage Courts</div>
        <div className="grid sm:grid-cols-3 gap-3">
          <input value={name} onChange={e=>setName(e.target.value)} className="border rounded px-3 py-2" />
          <select value={surface} onChange={e=>setSurface(e.target.value)} className="border rounded px-3 py-2">
            <option>hard</option><option>clay</option><option>grass</option><option>carpet</option>
          </select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={indoor} onChange={e=>setIndoor(e.target.checked)} /> Indoor</label>
        </div>
        <button onClick={create} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded px-4 py-2">Add Court</button>
        <ul className="grid sm:grid-cols-2 gap-3">
          {courts.map(c => <li key={c._id} className="border rounded p-3">{c.name} · {c.surface} {c.indoor? '· Indoor':''}</li>)}
        </ul>
      </div>
    </div>
  )
}

function HomePage() {
  return (
    <div className="grid md:grid-cols-2 gap-6 items-start">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">Tennis Club</h1>
        <p className="text-gray-600">Book courts, track results, and improve with AI coaching.</p>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/book" className="bg-white border rounded p-4 hover:shadow">Book a court</Link>
          <Link to="/tournaments" className="bg-white border rounded p-4 hover:shadow">Tournaments</Link>
          <Link to="/leaderboard" className="bg-white border rounded p-4 hover:shadow">Leaderboard</Link>
          <Link to="/ai" className="bg-white border rounded p-4 hover:shadow">AI Coach</Link>
        </div>
      </div>
      <div className="bg-white border rounded p-6">
        <div className="font-medium mb-2">This Week</div>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>Open play mornings 7–9am</li>
          <li>Beginner clinic Sat 10am</li>
          <li>Mixed doubles ladder ongoing</li>
        </ul>
      </div>
    </div>
  )
}

export default function AppRoot() {
  const auth = useAuth()
  return (
    <BrowserRouter>
      <Shell me={auth.me} onLogout={auth.logout}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login onLogin={auth.login} />} />
          <Route path="/book" element={<Bookings token={auth.token} />} />
          <Route path="/tournaments" element={<Tournaments />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/players" element={<Players />} />
          <Route path="/ai" element={<AIAssistant />} />
          <Route path="/admin" element={<Admin token={auth.token} />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  )
}
