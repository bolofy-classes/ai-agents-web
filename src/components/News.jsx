import { useEffect, useState } from 'react'
import * as newsApi from '../api/news'

const GNEWS_SIGNUP = 'https://gnews.io/'

function timeAgo(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const mins = Math.round((Date.now() - d.getTime()) / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function SummaryButton({ a }) {
  const [summary, setSummary] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const handleClick = async (e) => {
    // The card is a link — don't navigate when summarizing.
    e.preventDefault()
    e.stopPropagation()
    if (summary) {
      setSummary('') // toggle closed
      return
    }
    setBusy(true)
    setErr('')
    try {
      const res = await newsApi.summarizeArticle(a)
      setSummary(res.summary)
    } catch (e2) {
      setErr(e2.message || 'Summary failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-2" onClick={(e) => { e.preventDefault(); e.stopPropagation() }}>
      <button
        onClick={handleClick}
        disabled={busy}
        className="rounded-full border border-neutral-300 px-2.5 py-1 text-[11px] font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-50"
      >
        {busy ? 'Summarizing…' : summary ? '✕ Hide summary' : '✨ AI Summary'}
      </button>
      {summary && (
        <div className="mt-2 rounded-lg bg-neutral-100 px-3 py-2 text-[12px] text-neutral-700">
          <span className="font-semibold text-neutral-900">AI:</span> {summary}
        </div>
      )}
      {err && <div className="mt-1 text-[11px] text-red-600">{err}</div>}
    </div>
  )
}

function HeroCard({ a }) {
  return (
    <a
      href={a.url}
      target="_blank"
      rel="noreferrer"
      className="group relative col-span-full overflow-hidden rounded-2xl border border-neutral-200 bg-white"
    >
      <div className="grid gap-0 md:grid-cols-2">
        <div className="relative h-52 w-full overflow-hidden bg-neutral-100 md:h-full md:min-h-[240px]">
          {a.image ? (
            <img
              src={a.image}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl">📰</div>
          )}
        </div>
        <div className="flex flex-col justify-center p-5 md:p-6">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
            <span className="rounded bg-neutral-900 px-1.5 py-0.5 text-white">Top story</span>
            <span>{a.source}</span>
          </div>
          <div className="mb-2 text-[19px] font-bold leading-snug text-neutral-900">{a.title}</div>
          {a.description && <div className="mb-3 line-clamp-3 text-[13px] text-neutral-500">{a.description}</div>}
          <div className="text-[11px] text-neutral-400">{timeAgo(a.publishedAt)}</div>
          <SummaryButton a={a} />
        </div>
      </div>
    </a>
  )
}

function ArticleCard({ a }) {
  return (
    <a
      href={a.url}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:shadow-md"
    >
      <div className="h-40 w-full overflow-hidden bg-neutral-100">
        {a.image ? (
          <img
            src={a.image}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => { e.currentTarget.parentElement.style.display = 'none' }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl">📰</div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{a.source}</div>
        <div className="mb-1 line-clamp-2 text-[14px] font-semibold leading-snug text-neutral-900">{a.title}</div>
        {a.description && <div className="line-clamp-2 text-[12px] text-neutral-500">{a.description}</div>}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-[11px] text-neutral-400">{timeAgo(a.publishedAt)}</span>
        </div>
        <SummaryButton a={a} />
      </div>
    </a>
  )
}

function SettingsPanel({ settings, allCategories, onSaved, onClose }) {
  const [apiKey, setApiKey] = useState('')
  const [categories, setCategories] = useState(settings.categories || ['general'])
  const [country, setCountry] = useState(settings.country || 'us')
  const [lang, setLang] = useState(settings.lang || 'en')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const toggleCat = (c) =>
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))

  const handleSave = async () => {
    setSaving(true)
    setMsg(null)
    try {
      const body = { categories, country, lang }
      if (apiKey.trim()) body.apiKey = apiKey.trim()
      const res = await newsApi.saveSettings(body)
      setApiKey('')
      onSaved(res.settings)
      setMsg({ type: 'ok', text: 'Settings saved.' })
    } catch (err) {
      setMsg({ type: 'err', text: err.message || 'Save failed' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mb-4 rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-neutral-900">News Settings</span>
        <button onClick={onClose} className="text-[13px] text-neutral-500 hover:text-neutral-900">Close</button>
      </div>

      <label className="mb-1.5 block text-[13px] font-medium text-neutral-800">
        GNews API Key {settings.hasApiKey && <span className="text-green-600">· key saved</span>}
      </label>
      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder={settings.hasApiKey ? '•••••••• (leave blank to keep current)' : 'Paste your GNews API key'}
        className="mb-1 w-full rounded-[9px] border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400"
      />
      <p className="mb-4 text-[11px] text-neutral-400">
        Don’t have one?{' '}
        <a href={GNEWS_SIGNUP} target="_blank" rel="noreferrer" className="font-medium text-neutral-700 underline">
          Get a free API key at gnews.io →
        </a>{' '}
        Stored per user.
      </p>

      <label className="mb-1.5 block text-[13px] font-medium text-neutral-800">Categories</label>
      <div className="mb-4 flex flex-wrap gap-2">
        {allCategories.map((c) => {
          const on = categories.includes(c)
          return (
            <button
              key={c}
              onClick={() => toggleCat(c)}
              className={`rounded-full border px-3 py-1 text-[12px] font-medium capitalize transition ${
                on ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {c}
            </button>
          )
        })}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-neutral-800">Country</label>
          <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="us" className="w-full rounded-[9px] border border-neutral-200 px-3.5 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-neutral-800">Language</label>
          <input value={lang} onChange={(e) => setLang(e.target.value)} placeholder="en" className="w-full rounded-[9px] border border-neutral-200 px-3.5 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" />
        </div>
      </div>

      {msg && <div className={`mb-3 text-[12px] ${msg.type === 'ok' ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</div>}

      <button onClick={handleSave} disabled={saving || categories.length === 0} className="rounded-[9px] bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-60">
        {saving ? 'Saving…' : 'Save settings'}
      </button>
    </div>
  )
}

export default function News() {
  const [settings, setSettings] = useState(null)
  const [allCategories, setAllCategories] = useState([])
  const [activeCat, setActiveCat] = useState(null)
  const [activeQuery, setActiveQuery] = useState(null) // active search term
  const [searchInput, setSearchInput] = useState('')
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    newsApi
      .getSettings()
      .then((res) => {
        setSettings(res.settings)
        setAllCategories(res.categories)
        setActiveCat(res.settings.categories?.[0] || 'general')
        if (!res.settings.hasApiKey) {
          setShowSettings(true)
          setLoading(false)
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load settings')
        setLoading(false)
      })
  }, [])

  // Fetch when the active category OR search term changes (cached client-side).
  useEffect(() => {
    if (!settings?.hasApiKey) return
    if (!activeQuery && !activeCat) return
    setFetching(true)
    setError('')
    newsApi
      .getNews(activeQuery ? { q: activeQuery } : { category: activeCat })
      .then((res) => setArticles(res.articles || []))
      .catch((err) => setError(err.message || 'Failed to load news'))
      .finally(() => {
        setFetching(false)
        setLoading(false)
      })
  }, [settings, activeCat, activeQuery])

  const onSaved = (s) => {
    setSettings(s)
    setActiveCat(s.categories?.[0] || 'general')
    setActiveQuery(null)
    setShowSettings(false)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const q = searchInput.trim()
    if (!q) return
    setActiveQuery(q)
  }

  const clearSearch = () => {
    setSearchInput('')
    setActiveQuery(null)
  }

  const tabs = settings?.categories?.length ? settings.categories : ['general']
  const [hero, ...rest] = articles

  return (
    <div className="animate-[fadeIn_0.3s_ease]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-1 text-[22px] font-semibold text-neutral-900">News</h1>
          <p className="text-sm text-neutral-500">Top headlines powered by GNews.</p>
        </div>
        <button onClick={() => setShowSettings((v) => !v)} className="rounded-[9px] border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100">
          ⚙ Settings
        </button>
      </div>

      {settings && showSettings && (
        <SettingsPanel settings={settings} allCategories={allCategories} onSaved={onSaved} onClose={() => setShowSettings(false)} />
      )}

      {/* Search + category tabs */}
      {settings?.hasApiKey && (
        <div className="mb-5 flex flex-col gap-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search news… (press Enter)"
              className="flex-1 rounded-[9px] border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400"
            />
            <button type="submit" disabled={fetching || !searchInput.trim()} className="rounded-[9px] bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-60">
              🔍 Search
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {activeQuery ? (
              <span className="flex items-center gap-2 rounded-full bg-neutral-900 px-3.5 py-1.5 text-[13px] font-medium text-white">
                Search: “{activeQuery}”
                <button onClick={clearSearch} className="text-neutral-300 hover:text-white">✕</button>
              </span>
            ) : (
              tabs.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCat(c)}
                  className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium capitalize transition ${
                    activeCat === c ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {c}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-[9px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">
          {error}
        </div>
      )}

      {/* Content */}
      {loading || fetching ? (
        <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-16 text-center text-[13px] text-neutral-400">Loading…</div>
      ) : !settings?.hasApiKey ? (
        <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-14 text-center">
          <div className="mb-2 text-3xl">📰</div>
          <div className="mb-1 text-sm font-semibold text-neutral-900">No API key yet</div>
          <div className="mb-4 text-[13px] text-neutral-500">Add your GNews API key to load headlines.</div>
          <a href={GNEWS_SIGNUP} target="_blank" rel="noreferrer" className="inline-block rounded-[9px] bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700">
            Get a free API key →
          </a>
        </div>
      ) : articles.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-14 text-center text-[13px] text-neutral-400">No articles found.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hero && <HeroCard a={hero} />}
          {rest.map((a) => (
            <ArticleCard key={a.url} a={a} />
          ))}
        </div>
      )}
    </div>
  )
}

export { ArticleCard }
