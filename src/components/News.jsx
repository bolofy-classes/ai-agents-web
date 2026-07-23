import { useEffect, useState } from 'react'
import * as newsApi from '../api/news'
import * as socialApi from '../api/social'
import { PLATFORMS, PLATFORM_KEYS } from './SocialMedia'

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

function CardFooter({ a, onCreatePost }) {
  const [summary, setSummary] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const handleSummary = async (e) => {
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

  const handleCreatePost = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onCreatePost(a)
  }

  return (
    <div className="mt-2" onClick={(e) => { e.preventDefault(); e.stopPropagation() }}>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleSummary}
          disabled={busy}
          className="rounded-full border border-neutral-300 px-2.5 py-1 text-[11px] font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-50"
        >
          {busy ? 'Summarizing…' : summary ? '✕ Hide summary' : '✨ AI Summary'}
        </button>
        <button
          onClick={handleCreatePost}
          className="rounded-full border border-neutral-300 px-2.5 py-1 text-[11px] font-medium text-neutral-700 transition hover:bg-neutral-100"
        >
          📣 Create post
        </button>
      </div>
      {summary && (
        <div className="mt-2 rounded-lg bg-neutral-100 px-3 py-2 text-[12px] text-neutral-700">
          <span className="font-semibold text-neutral-900">AI:</span> {summary}
        </div>
      )}
      {err && <div className="mt-1 text-[11px] text-red-600">{err}</div>}
    </div>
  )
}

function buildPostPrompt(a) {
  const bits = [`Title: "${a.title}"`]
  if (a.description) bits.push(`Details: ${a.description}`)
  if (a.source) bits.push(`Source: ${a.source}`)
  if (a.url) bits.push(`Link: ${a.url}`)
  return `Write a social media post about this news story.\n${bits.join('\n')}`
}

function PostModal({ article, onClose }) {
  const [drafts, setDrafts] = useState(null)
  const [activeTab, setActiveTab] = useState('linkedin')
  const [generating, setGenerating] = useState(false)
  const [linkedin, setLinkedin] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null) // { platform, postUrl, draft }

  useEffect(() => {
    if (!article) return
    setDrafts(null)
    setActiveTab('linkedin')
    setError('')
    setResult(null)
    setGenerating(true)

    socialApi.getLinkedInStatus().then(setLinkedin).catch(() => {})
    socialApi
      .generate(buildPostPrompt(article))
      .then((res) => setDrafts(res.posts))
      .catch((err) => setError(err.message || 'Could not generate a post'))
      .finally(() => setGenerating(false))
  }, [article])

  if (!article) return null

  const handleConnectLinkedIn = async () => {
    try {
      const url = await socialApi.getLinkedInAuthUrl()
      window.location.href = url
    } catch (err) {
      setError(err.message || 'Could not start LinkedIn sign-in')
    }
  }

  const handleSaveDraft = async () => {
    const platform = activeTab
    setBusy(true)
    setError('')
    try {
      await socialApi.createPost({ platform, content: drafts[platform], prompt: article.title })
      setResult({ platform, draft: true })
    } catch (err) {
      setError(err.message || 'Could not save draft')
    } finally {
      setBusy(false)
    }
  }

  const handlePostNow = async () => {
    const platform = activeTab
    setBusy(true)
    setError('')
    try {
      const post = await socialApi.createPost({
        platform,
        content: drafts[platform],
        prompt: article.title,
      })

      if (platform === 'linkedin') {
        const published = await socialApi.publish(post._id)
        setResult({ platform, postUrl: published.postUrl })
      } else {
        try {
          await navigator.clipboard?.writeText(drafts[platform])
        } catch {
          /* clipboard may be unavailable; continue */
        }
        const postUrl = window.prompt(
          `Content copied to clipboard. Post it on ${PLATFORMS[platform].label}, then paste the post URL here:`
        )
        if (!postUrl) {
          setBusy(false)
          return
        }
        const updated = await socialApi.markPosted(post._id, postUrl)
        setResult({ platform, postUrl: updated.postUrl })
      }
    } catch (err) {
      setError(err.message || 'Post failed')
    } finally {
      setBusy(false)
    }
  }

  const needsLinkedInConnect = activeTab === 'linkedin' && linkedin && !linkedin.connected

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-[fadeIn_0.15s_ease]"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-neutral-900">Create social post</div>
            <div className="line-clamp-1 text-[12px] text-neutral-500">{article.title}</div>
          </div>
          <button onClick={onClose} className="flex-shrink-0 text-neutral-400 hover:text-neutral-900">✕</button>
        </div>

        {generating ? (
          <div className="py-10 text-center text-[13px] text-neutral-400">✨ Generating drafts…</div>
        ) : error && !drafts ? (
          <div className="rounded-[9px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">{error}</div>
        ) : drafts ? (
          <>
            {/* Platform tabs */}
            <div className="mb-3 flex gap-1">
              {PLATFORM_KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium ${
                    activeTab === key ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  <span>{PLATFORMS[key].icon}</span>
                  {PLATFORMS[key].label}
                </button>
              ))}
            </div>

            {/* Preview / edit */}
            {PLATFORM_KEYS.map((key) => {
              if (key !== activeTab) return null
              const over = drafts[key].length > PLATFORMS[key].limit
              return (
                <div key={key}>
                  <textarea
                    value={drafts[key]}
                    onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))}
                    rows={6}
                    className="w-full resize-y rounded-[9px] border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400"
                  />
                  <div className="mt-1.5">
                    <span className={`text-xs ${over ? 'font-semibold text-red-600' : 'text-neutral-400'}`}>
                      {drafts[key].length}/{PLATFORMS[key].limit} characters
                    </span>
                  </div>
                </div>
              )
            })}

            {error && <div className="mt-2 text-[12px] text-red-600">{error}</div>}

            {result ? (
              <div className="mt-4 rounded-[9px] border border-green-200 bg-green-50 px-3.5 py-2.5 text-[13px] text-green-700">
                {result.draft ? (
                  <>💾 Saved as a {PLATFORMS[result.platform].label} draft. Publish it later from the Social Media tab.</>
                ) : (
                  <>
                    ✅ Posted to {PLATFORMS[result.platform].label}.{' '}
                    {result.postUrl && (
                      <a href={result.postUrl} target="_blank" rel="noreferrer" className="font-medium underline">
                        View post →
                      </a>
                    )}
                  </>
                )}
              </div>
            ) : needsLinkedInConnect ? (
              <div className="mt-4 flex items-center justify-between gap-2 rounded-[9px] border border-amber-200 bg-amber-50 px-3.5 py-2.5">
                <span className="text-[12px] text-amber-700">Connect LinkedIn to post automatically.</span>
                <button
                  onClick={handleConnectLinkedIn}
                  className="flex-shrink-0 rounded-[9px] bg-[#0a66c2] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#004182]"
                >
                  💼 Connect
                </button>
              </div>
            ) : (
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={onClose} className="rounded-[9px] border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100">
                  Cancel
                </button>
                <button
                  onClick={handleSaveDraft}
                  disabled={busy || !drafts[activeTab].trim()}
                  className="rounded-[9px] border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-60"
                >
                  {busy ? '…' : '💾 Save draft'}
                </button>
                <button
                  onClick={handlePostNow}
                  disabled={busy || !drafts[activeTab].trim()}
                  className="rounded-[9px] bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-60"
                >
                  {busy ? 'Posting…' : activeTab === 'linkedin' ? '🚀 Post to LinkedIn' : '📋 Copy & mark posted'}
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}

function HeroCard({ a, onCreatePost }) {
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
          <CardFooter a={a} onCreatePost={onCreatePost} />
        </div>
      </div>
    </a>
  )
}

function ArticleCard({ a, onCreatePost }) {
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
        <CardFooter a={a} onCreatePost={onCreatePost} />
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
  const [postArticle, setPostArticle] = useState(null)

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
          {hero && <HeroCard a={hero} onCreatePost={setPostArticle} />}
          {rest.map((a) => (
            <ArticleCard key={a.url} a={a} onCreatePost={setPostArticle} />
          ))}
        </div>
      )}

      <PostModal article={postArticle} onClose={() => setPostArticle(null)} />
    </div>
  )
}

export { ArticleCard }
