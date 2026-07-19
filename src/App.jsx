import { useEffect, useState } from 'react'
import * as authApi from './api/auth'
import * as gmailApi from './api/gmail'
import * as newsApi from './api/news'
import * as socialApi from './api/social'
import EmailList from './components/EmailList'
import News from './components/News'
import Weather from './components/Weather'
import SocialMedia from './components/SocialMedia'

const chartData = [40, 65, 50, 80, 60, 90, 70]
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const activity = [
  { text: 'New user registered — Sarah Chen', time: '5 minutes ago' },
  { text: 'Payment received from Acme Corp', time: '1 hour ago' },
  { text: 'Server deployment completed', time: '3 hours ago' },
  { text: 'Weekly report generated', time: 'Yesterday' },
]

const navDefs = [
  { key: 'dashboard', label: 'Dashboard', icon: '▦' },
  { key: 'gmail', label: 'Gmail', icon: '✉' },
  { key: 'news', label: 'News', icon: '📰' },
  { key: 'social', label: 'Social Media', icon: '📣' },
]

const platformMeta = {
  linkedin: { label: 'LinkedIn', icon: '💼', badge: 'bg-blue-100 text-blue-700' },
  x: { label: 'X', icon: '𝕏', badge: 'bg-neutral-200 text-neutral-800' },
  instagram: { label: 'Instagram', icon: '📸', badge: 'bg-pink-100 text-pink-700' },
}

function timeAgo(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const mins = Math.round((Date.now() - d.getTime()) / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    let eErr = ''
    let pErr = ''
    if (!email.trim()) eErr = 'Email is required'
    else if (!emailRe.test(email)) eErr = 'Enter a valid email address'
    if (!password.trim()) pErr = 'Password is required'
    else if (password.length < 6) pErr = 'Password must be at least 6 characters'

    if (eErr || pErr) {
      setEmailError(eErr)
      setPasswordError(pErr)
      return
    }

    setSubmitting(true)
    try {
      const user = await authApi.login(email.trim(), password)
      onLogin(user)
    } catch (err) {
      setFormError(err.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-[400px] rounded-2xl border border-neutral-200 bg-white p-10 shadow-sm animate-[fadeIn_0.4s_ease]">
        <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-[10px] bg-neutral-900">
          <div className="h-4 w-4 rounded bg-white" />
        </div>
        <h1 className="mb-1 text-[22px] font-semibold text-neutral-900">Welcome back</h1>
        <p className="mb-7 text-sm text-neutral-500">Sign in to continue to your dashboard</p>

        {formError && (
          <div className="mb-4 rounded-[9px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-neutral-800">Email</label>
            <input
              type="text"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(''); setFormError('') }}
              placeholder="you@example.com"
              disabled={submitting}
              className={`w-full rounded-[9px] border px-3.5 py-2.5 text-sm text-neutral-900 outline-none disabled:opacity-60 ${emailError ? 'border-red-600' : 'border-neutral-200'}`}
            />
            {emailError && <p className="mt-1.5 text-xs text-red-600">{emailError}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-neutral-800">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(''); setFormError('') }}
              placeholder="••••••••"
              disabled={submitting}
              className={`w-full rounded-[9px] border px-3.5 py-2.5 text-sm text-neutral-900 outline-none disabled:opacity-60 ${passwordError ? 'border-red-600' : 'border-neutral-200'}`}
            />
            {passwordError && <p className="mt-1.5 text-xs text-red-600">{passwordError}</p>}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full cursor-pointer rounded-[9px] bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-5 text-center text-xs text-neutral-400">Use your seeded account, e.g. admin@example.com</p>
      </div>
    </div>
  )
}

function Dashboard({ userName, onOpenGmail, onOpenNews, onOpenSocial }) {
  const [emails, setEmails] = useState([])
  const [emailsConnected, setEmailsConnected] = useState(false)
  const [emailsLoading, setEmailsLoading] = useState(true)

  const [news, setNews] = useState([])
  const [newsHasKey, setNewsHasKey] = useState(false)
  const [newsLoading, setNewsLoading] = useState(true)

  const [social, setSocial] = useState(null) // analytics payload

  useEffect(() => {
    socialApi
      .getAnalytics()
      .then((res) => setSocial(res))
      .catch(() => {})
  }, [])

  const socialCards = [
    { label: 'Posts Published', value: social ? social.totals.postedCount : '—', icon: '🚀' },
    { label: 'Total Likes', value: social ? social.totals.totalLikes : '—', icon: '❤️' },
    { label: 'Drafts', value: social ? social.totals.draftCount : '—', icon: '📝' },
    {
      label: 'LinkedIn',
      value: social ? (social.linkedinConnected ? 'Connected' : 'Not connected') : '—',
      icon: '💼',
    },
  ]

  useEffect(() => {
    gmailApi
      .getMessages()
      .then((res) => {
        setEmailsConnected(res.connected)
        setEmails((res.messages || []).slice(0, 5))
      })
      .catch(() => {})
      .finally(() => setEmailsLoading(false))
  }, [])

  useEffect(() => {
    newsApi
      .getSettings()
      .then((res) => {
        setNewsHasKey(res.settings.hasApiKey)
        if (!res.settings.hasApiKey) return null
        return newsApi.getNews().then((r) => setNews((r.articles || []).slice(0, 4)))
      })
      .catch(() => {})
      .finally(() => setNewsLoading(false))
  }, [])

  return (
    <div className="animate-[fadeIn_0.3s_ease]">
      <h1 className="mb-1 text-[22px] font-semibold text-neutral-900">Welcome back, {userName}</h1>
      <p className="mb-6 text-sm text-neutral-500">Here's what's happening with your account today.</p>

      {/* Top row: Recent News (improved) + Weather */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        {/* Recent News */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 items-center justify-center">
                <span className="absolute h-2 w-2 animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="h-2 w-2 rounded-full bg-red-500" />
              </span>
              <span className="text-sm font-semibold text-neutral-900">Recent News</span>
            </div>
            <button onClick={onOpenNews} className="text-[13px] font-medium text-neutral-500 hover:text-neutral-900">
              Open News →
            </button>
          </div>

          {newsLoading ? (
            <div className="flex flex-1 items-center justify-center px-5 py-10 text-center text-[13px] text-neutral-400">Loading…</div>
          ) : !newsHasKey ? (
            <div className="flex flex-1 items-center justify-center px-5 py-10 text-center text-[13px] text-neutral-400">
              <span>
                No GNews key set.{' '}
                <button onClick={onOpenNews} className="font-medium text-neutral-700 underline">Add one</button>{' '}
                to see headlines.
              </span>
            </div>
          ) : news.length === 0 ? (
            <div className="flex flex-1 items-center justify-center px-5 py-10 text-center text-[13px] text-neutral-400">No news right now.</div>
          ) : (
            <div>
              {news.map((a, i) => (
                <a
                  key={a.url}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3.5 border-b border-neutral-100 px-5 py-3.5 last:border-b-0 hover:bg-neutral-50"
                >
                  <div className="h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    {a.image ? (
                      <img src={a.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" onError={(e) => { e.currentTarget.parentElement.style.display = 'none' }} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg">📰</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center gap-2">
                      {i === 0 && <span className="rounded bg-neutral-900 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">Top</span>}
                      <span className="truncate text-[11px] font-medium uppercase tracking-wide text-neutral-400">{a.source}</span>
                    </div>
                    <div className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-neutral-900 group-hover:text-neutral-700">{a.title}</div>
                    {a.publishedAt && <div className="mt-0.5 text-[11px] text-neutral-400">{timeAgo(a.publishedAt)}</div>}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Weather */}
        <Weather />
      </div>

      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-neutral-900">Social Media Analytics</span>
        <button onClick={onOpenSocial} className="text-[13px] font-medium text-neutral-500 hover:text-neutral-900">
          Open Social Media →
        </button>
      </div>
      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        {socialCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="mb-3.5 flex items-center justify-between">
              <span className="text-[13px] font-medium text-neutral-500">{card.label}</span>
              <span className="text-base">{card.icon}</span>
            </div>
            <div className="text-[26px] font-bold text-neutral-900">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="mb-[18px] text-sm font-semibold text-neutral-900">Weekly Activity</div>
          <div className="flex h-40 items-end gap-2.5">
            {chartData.map((v, i) => (
              <div key={days[i]} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <div className="w-full max-w-[28px] rounded-t-[5px] bg-neutral-900" style={{ height: `${v}%` }} />
                <span className="text-[11px] text-neutral-400">{days[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="mb-4 text-sm font-semibold text-neutral-900">Recent Activity</div>
          <div className="flex flex-col gap-3.5">
            {activity.map((act) => (
              <div key={act.text} className="flex items-start gap-2.5">
                <div className="mt-[5px] h-2 w-2 flex-shrink-0 rounded-full bg-neutral-900" />
                <div className="min-w-0">
                  <div className="text-[13px] text-neutral-800">{act.text}</div>
                  <div className="mt-0.5 text-[11px] text-neutral-400">{act.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Emails (from Gmail AI Agent) */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-[18px]">
          <span className="text-sm font-semibold text-neutral-900">Recent Emails</span>
          <button onClick={onOpenGmail} className="text-[13px] font-medium text-neutral-500 hover:text-neutral-900">
            Open Gmail →
          </button>
        </div>
        {emailsLoading ? (
          <div className="px-5 py-8 text-center text-[13px] text-neutral-400">Loading…</div>
        ) : !emailsConnected ? (
          <div className="px-5 py-8 text-center text-[13px] text-neutral-400">
            Gmail not connected.{' '}
            <button onClick={onOpenGmail} className="font-medium text-neutral-700 underline">
              Connect it
            </button>{' '}
            to see your inbox here.
          </div>
        ) : (
          <EmailList messages={emails} compact />
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-[18px]">
          <span className="text-sm font-semibold text-neutral-900">Recent Posts</span>
          <button onClick={onOpenSocial} className="text-[13px] font-medium text-neutral-500 hover:text-neutral-900">
            Open Social Media →
          </button>
        </div>
        {!social ? (
          <div className="px-5 py-8 text-center text-[13px] text-neutral-400">Loading…</div>
        ) : social.recent.length === 0 ? (
          <div className="px-5 py-8 text-center text-[13px] text-neutral-400">
            No published posts yet.{' '}
            <button onClick={onOpenSocial} className="font-medium text-neutral-700 underline">
              Create one
            </button>
            .
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-neutral-50">
                  {['Platform', 'Content', 'Likes', 'Post URL'].map((h) => (
                    <th key={h} className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {social.recent.map((p) => {
                  const meta = platformMeta[p.platform] || { label: p.platform, icon: '📣', badge: 'bg-neutral-100 text-neutral-600' }
                  return (
                    <tr key={p._id} className="border-t border-neutral-100">
                      <td className="px-5 py-3.5">
                        <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.badge}`}>{meta.icon} {meta.label}</span>
                      </td>
                      <td className="max-w-[320px] px-5 py-3.5 text-[13px] text-neutral-700"><div className="line-clamp-1">{p.content}</div></td>
                      <td className="px-5 py-3.5 text-[13px] font-semibold text-neutral-900">{p.likes}</td>
                      <td className="max-w-[200px] px-5 py-3.5 text-[13px]">
                        {p.postUrl ? (
                          <a href={p.postUrl} target="_blank" rel="noreferrer" className="block truncate text-blue-600 hover:underline" title={p.postUrl}>{p.postUrl}</a>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function Gmail() {
  const [status, setStatus] = useState(null) // { connected, gmailEmail, lastSyncedAt }
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')
  const [syncCount, setSyncCount] = useState(25)

  // AI bulk-cleanup state
  const [suggesting, setSuggesting] = useState(false)
  const [suggestions, setSuggestions] = useState(null) // null=closed; []=none; [...]=open
  const [selected, setSelected] = useState(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const refresh = async () => {
    try {
      const [st, msgs] = await Promise.all([gmailApi.getStatus(), gmailApi.getMessages()])
      setStatus(st)
      setMessages(msgs.messages || [])
    } catch (err) {
      setError(err.message || 'Failed to load Gmail')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const handleConnect = async () => {
    setConnecting(true)
    setError('')
    try {
      const url = await gmailApi.getAuthUrl()
      window.location.href = url // redirect to Google consent
    } catch (err) {
      setError(err.message || 'Could not start Google sign-in')
      setConnecting(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setError('')
    try {
      const res = await gmailApi.sync(syncCount)
      setMessages(res.messages || [])
      setStatus((s) => ({ ...s, lastSyncedAt: res.lastSyncedAt }))
    } catch (err) {
      setError(err.message || 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const handleDisconnect = async () => {
    await gmailApi.disconnect()
    setMessages([])
    refresh()
  }

  const updateSummary = (gmailId, summary) =>
    setMessages((list) => list.map((m) => (m.gmailId === gmailId ? { ...m, summary } : m)))

  const removeEmail = (gmailId) => {
    setMessages((list) => list.filter((m) => m.gmailId !== gmailId))
    setSuggestions((sug) => (sug ? sug.filter((s) => s.gmailId !== gmailId) : sug))
  }

  const handleSuggestCleanup = async () => {
    setSuggesting(true)
    setError('')
    try {
      const res = await gmailApi.suggestDelete()
      setSuggestions(res.suggestions)
      setSelected(new Set(res.suggestions.map((s) => s.gmailId))) // pre-select all
    } catch (err) {
      setError(err.message || 'Could not get cleanup suggestions')
    } finally {
      setSuggesting(false)
    }
  }

  const toggleSelected = (gmailId) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(gmailId)) next.delete(gmailId)
      else next.add(gmailId)
      return next
    })

  const handleBulkDelete = async () => {
    const ids = [...selected]
    if (!ids.length) return
    setBulkDeleting(true)
    setError('')
    try {
      await gmailApi.trash(ids)
      setMessages((list) => list.filter((m) => !selected.has(m.gmailId)))
      setSuggestions(null)
      setSelected(new Set())
    } catch (err) {
      setError(err.message || 'Bulk delete failed')
    } finally {
      setBulkDeleting(false)
    }
  }

  const lastSynced = status?.lastSyncedAt
    ? new Date(status.lastSyncedAt).toLocaleString()
    : null

  return (
    <div className="animate-[fadeIn_0.3s_ease]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-1 text-[22px] font-semibold text-neutral-900">Gmail AI Agent</h1>
          <p className="text-sm text-neutral-500">
            {status?.connected
              ? `Connected as ${status.gmailEmail}${lastSynced ? ` · synced ${lastSynced}` : ''}`
              : 'Connect your inbox to summarize, reply, and auto-schedule meetings.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {status?.connected ? (
            <>
              <div className="flex items-stretch overflow-hidden rounded-[9px] bg-neutral-900">
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-60"
                >
                  {syncing ? 'Syncing…' : '⟳ Sync'}
                </button>
                <select
                  value={syncCount}
                  onChange={(e) => setSyncCount(Number(e.target.value))}
                  disabled={syncing}
                  title="How many emails to fetch"
                  className="cursor-pointer border-l border-neutral-700 bg-neutral-900 pl-2 pr-1 text-sm font-medium text-white outline-none disabled:opacity-60"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <button
                onClick={handleSuggestCleanup}
                disabled={suggesting || !messages.length}
                className="rounded-[9px] border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-60"
              >
                {suggesting ? 'Analyzing…' : '🧹 AI Cleanup'}
              </button>
              <button
                onClick={handleDisconnect}
                className="rounded-[9px] border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="rounded-[9px] bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-60"
            >
              {connecting ? 'Redirecting…' : 'Connect Gmail'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-[9px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">
          {error}
        </div>
      )}

      {/* AI cleanup suggestions panel */}
      {suggestions !== null && (
        <div className="mb-4 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between border-b border-amber-200 px-5 py-3">
            <span className="text-sm font-semibold text-neutral-900">
              🧹 AI suggests deleting {suggestions.length} email{suggestions.length === 1 ? '' : 's'}
            </span>
            <button onClick={() => setSuggestions(null)} className="text-[13px] text-neutral-500 hover:text-neutral-900">
              Dismiss
            </button>
          </div>
          {suggestions.length === 0 ? (
            <div className="px-5 py-6 text-center text-[13px] text-neutral-500">
              Nothing to clean up — your inbox looks tidy.
            </div>
          ) : (
            <>
              <div className="max-h-72 overflow-y-auto">
                {suggestions.map((s) => (
                  <label
                    key={s.gmailId}
                    className="flex cursor-pointer items-start gap-3 border-b border-amber-100 px-5 py-2.5 last:border-b-0 hover:bg-amber-100/40"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(s.gmailId)}
                      onChange={() => toggleSelected(s.gmailId)}
                      className="mt-0.5 h-4 w-4 flex-shrink-0 accent-neutral-900"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-neutral-900">{s.subject || '(no subject)'}</div>
                      <div className="truncate text-[12px] text-neutral-500">{s.from}</div>
                      <div className="text-[11px] font-medium text-amber-700">Reason: {s.reason}</div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-amber-200 px-5 py-3">
                <span className="text-[12px] text-neutral-500">{selected.size} selected</span>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting || selected.size === 0}
                  className="rounded-[9px] bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {bulkDeleting ? 'Deleting…' : `🗑 Move ${selected.size} to Trash`}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        {loading ? (
          <div className="px-5 py-10 text-center text-[13px] text-neutral-400">Loading…</div>
        ) : !status?.connected ? (
          <div className="px-5 py-12 text-center">
            <div className="mb-2 text-3xl">✉️</div>
            <div className="mb-1 text-sm font-semibold text-neutral-900">Gmail not connected</div>
            <div className="text-[13px] text-neutral-500">Click “Connect Gmail” to authorize access.</div>
          </div>
        ) : (
          <EmailList messages={messages} onSummary={updateSummary} onRemove={removeEmail} />
        )}
      </div>
    </div>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [restoring, setRestoring] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activePage, setActivePage] = useState('dashboard')
  const [profileOpen, setProfileOpen] = useState(false)

  // Land on the Gmail page after the OAuth redirect (?gmail=connected|error).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('gmail')) {
      setActivePage('gmail')
      window.history.replaceState({}, '', window.location.pathname)
    } else if (params.has('linkedin')) {
      setActivePage('social')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // Restore an existing session from a stored token on first load.
  useEffect(() => {
    let active = true
    async function restore() {
      if (!authApi.hasToken()) {
        setRestoring(false)
        return
      }
      try {
        const current = await authApi.getCurrentUser()
        if (active) setUser(current)
      } catch {
        authApi.logout()
      } finally {
        if (active) setRestoring(false)
      }
    }
    restore()
    return () => { active = false }
  }, [])

  const userName = user?.name || 'User'
  const userInitial = userName.charAt(0).toUpperCase()
  const userEmail = user?.email || ''

  const handleLogout = () => {
    authApi.logout()
    setUser(null)
    setProfileOpen(false)
    setActivePage('dashboard')
  }

  if (restoring) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-neutral-50 text-sm text-neutral-400">
        Loading…
      </div>
    )
  }

  if (!user) {
    return <Login onLogin={(u) => setUser(u)} />
  }

  const activeLabel = navDefs.find((n) => n.key === activePage)?.label || 'Dashboard'

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Sidebar */}
      <div
        className="flex flex-shrink-0 flex-col overflow-hidden bg-neutral-900 text-white transition-all duration-200"
        style={{ width: sidebarOpen ? 220 : 72 }}
      >
        <div className="flex min-h-6 items-center gap-2.5 border-b border-neutral-800 px-[18px] py-5">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[7px] bg-white">
            <div className="h-2.5 w-2.5 rounded-[3px] bg-neutral-900" />
          </div>
          {sidebarOpen && <span className="whitespace-nowrap text-[15px] font-semibold">Acme Inc</span>}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-3">
          {navDefs.map((item) => {
            const active = activePage === item.key
            return (
              <button
                key={item.key}
                onClick={() => { setActivePage(item.key); setProfileOpen(false) }}
                className={`flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white hover:bg-neutral-800 ${active ? 'bg-neutral-800' : 'bg-transparent'}`}
              >
                <span className="w-5 flex-shrink-0 text-center text-[17px]">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            )
          })}
        </div>

        <div className="border-t border-neutral-800 p-3">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] text-neutral-400 hover:bg-neutral-800 hover:text-white ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
          >
            <span className="inline-block text-[15px]" style={{ transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)' }}>←</span>
            {sidebarOpen && <span>Collapse</span>}
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col bg-neutral-50">
        {/* Topbar */}
        <div className="relative flex h-16 flex-shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-7">
          <div className="text-[15px] font-semibold text-neutral-900">{activeLabel}</div>
          <div className="flex items-center gap-1.5">
            <button className="relative flex h-[38px] w-[38px] items-center justify-center rounded-[9px] border border-neutral-200 bg-white text-base hover:bg-neutral-100">
              🔔
              <span className="absolute right-2 top-[7px] h-[7px] w-[7px] rounded-full border-[1.5px] border-white bg-neutral-900" />
            </button>

            <div className="relative">
              <button
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 rounded-[9px] border border-neutral-200 bg-white py-[5px] pl-[5px] pr-2.5 hover:bg-neutral-100"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">{userInitial}</div>
                <span className="text-[13px] font-medium text-neutral-900">{userName}</span>
                <span className="text-[10px] text-neutral-400">▾</span>
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-[46px] z-10 w-50 animate-[fadeIn_0.15s_ease] rounded-xl border border-neutral-200 bg-white p-2 shadow-lg">
                  <div className="mb-1.5 border-b border-neutral-100 px-3 py-2.5">
                    <div className="text-[13px] font-semibold text-neutral-900">{userName}</div>
                    <div className="text-xs text-neutral-400">{userEmail}</div>
                  </div>
                  <button className="w-full rounded-lg px-3 py-2.5 text-left text-[13px] text-neutral-800 hover:bg-neutral-100">Settings</button>
                  <button
                    onClick={handleLogout}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-[13px] font-medium text-red-600 hover:bg-red-50"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 pb-10 pt-7">
          {activePage === 'dashboard' && (
            <Dashboard
              userName={userName}
              onOpenGmail={() => setActivePage('gmail')}
              onOpenNews={() => setActivePage('news')}
              onOpenSocial={() => setActivePage('social')}
            />
          )}
          {activePage === 'gmail' && <Gmail />}
          {activePage === 'news' && <News />}
          {activePage === 'social' && <SocialMedia />}
        </div>
      </div>
    </div>
  )
}

export default App
