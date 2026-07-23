import { useEffect, useState } from 'react'
import * as socialApi from '../api/social'

export const PLATFORMS = {
  linkedin: { label: 'LinkedIn', icon: '💼', badge: 'bg-blue-100 text-blue-700', limit: 3000 },
  x: { label: 'X', icon: '𝕏', badge: 'bg-neutral-200 text-neutral-800', limit: 280 },
  instagram: { label: 'Instagram', icon: '📸', badge: 'bg-pink-100 text-pink-700', limit: 2200 },
}
export const PLATFORM_KEYS = ['linkedin', 'x', 'instagram']

function StatusBadge({ status }) {
  const cls = status === 'posted' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${cls}`}>{status}</span>
}

const CRON_PRESETS = [
  { label: 'Daily at 9:00 AM', value: '0 9 * * *' },
  { label: 'Every 6 hours', value: '0 */6 * * *' },
  { label: 'Every hour', value: '0 * * * *' },
]

function ScheduleSection() {
  const [schedule, setSchedule] = useState(null) // last-saved copy, for the "last run" readout
  const [form, setForm] = useState(null) // editable draft
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    socialApi
      .getSchedule()
      .then((s) => {
        setSchedule(s)
        setForm(s)
      })
      .catch((err) => setError(err.message || 'Could not load schedule'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const updated = await socialApi.updateSchedule({
        enabled: form.enabled,
        cron: form.cron,
        platform: form.platform,
        topic: form.topic,
        footer: form.footer,
        autoPublish: form.autoPublish,
      })
      setSchedule(updated)
      setForm(updated)
      setNotice('Schedule saved')
      setTimeout(() => setNotice(''), 3000)
    } catch (err) {
      setError(err.message || 'Could not save schedule')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !form) {
    return (
      <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 text-[13px] text-neutral-400">
        Loading schedule…
      </div>
    )
  }

  const isPreset = CRON_PRESETS.some((p) => p.value === form.cron)
  const presetKey = isPreset ? form.cron : 'custom'

  return (
    <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-neutral-900">⏰ Auto-posting schedule (cron job)</div>
          <p className="text-[12px] text-neutral-500">
            On a recurring schedule, generate a post and{' '}
            {form.platform === 'linkedin' && form.autoPublish ? 'publish it automatically' : 'save it as a draft to review'}.
          </p>
        </div>
        <label className="flex flex-shrink-0 cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
            className="h-4 w-4 accent-neutral-900"
          />
          <span className="text-[13px] font-medium text-neutral-700">{form.enabled ? 'Enabled' : 'Disabled'}</span>
        </label>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-neutral-800">Frequency</label>
          <select
            value={presetKey}
            onChange={(e) => setForm((f) => ({ ...f, cron: e.target.value === 'custom' ? f.cron : e.target.value }))}
            className="w-full rounded-[9px] border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400"
          >
            {CRON_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
            <option value="custom">Custom cron expression</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-neutral-800">Platform</label>
          <select
            value={form.platform}
            onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
            className="w-full rounded-[9px] border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400"
          >
            {PLATFORM_KEYS.map((k) => (
              <option key={k} value={k}>{PLATFORMS[k].label}</option>
            ))}
          </select>
        </div>
      </div>

      {presetKey === 'custom' && (
        <div className="mt-3">
          <label className="mb-1.5 block text-[13px] font-medium text-neutral-800">Cron expression</label>
          <input
            value={form.cron}
            onChange={(e) => setForm((f) => ({ ...f, cron: e.target.value }))}
            placeholder="0 9 * * *"
            className="w-full rounded-[9px] border border-neutral-200 px-3.5 py-2.5 font-mono text-sm text-neutral-900 outline-none focus:border-neutral-400"
          />
          <p className="mt-1 text-[11px] text-neutral-400">
            Standard 5-field cron syntax (minute hour day month weekday), evaluated in the server's timezone.
          </p>
        </div>
      )}

      <div className="mt-3">
        <label className="mb-1.5 block text-[13px] font-medium text-neutral-800">Topic (optional)</label>
        <input
          value={form.topic}
          onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
          placeholder="Leave blank to auto-post about today's top news headline"
          className="w-full rounded-[9px] border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400"
        />
      </div>

      <div className="mt-3">
        <label className="mb-1.5 block text-[13px] font-medium text-neutral-800">Footer (optional)</label>
        <textarea
          value={form.footer || ''}
          onChange={(e) => setForm((f) => ({ ...f, footer: e.target.value }))}
          rows={2}
          placeholder="e.g. Disclaimer, sign-off, or CTA — inserted above the hashtags on every post"
          className="w-full resize-y rounded-[9px] border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400"
        />
        <p className="mt-1 text-[11px] text-neutral-400">
          Automatically inserted just above the hashtags on every generated post — scheduled and manual alike.
        </p>
      </div>

      {form.platform === 'linkedin' && (
        <label className="mt-3 flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={form.autoPublish}
            onChange={(e) => setForm((f) => ({ ...f, autoPublish: e.target.checked }))}
            className="h-4 w-4 accent-neutral-900"
          />
          <span className="text-[13px] text-neutral-700">
            Auto-publish to LinkedIn (requires LinkedIn connected) — otherwise saved as a draft
          </span>
        </label>
      )}

      {schedule?.lastRunAt && (
        <div className="mt-3 rounded-[9px] bg-neutral-50 px-3.5 py-2.5 text-[12px] text-neutral-500">
          Last run {new Date(schedule.lastRunAt).toLocaleString()} — {schedule.lastResult}
        </div>
      )}

      {error && <div className="mt-3 text-[12px] text-red-600">{error}</div>}
      {notice && <div className="mt-3 text-[12px] text-green-600">{notice}</div>}

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-[9px] bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save schedule'}
        </button>
      </div>
    </div>
  )
}

export default function SocialMedia() {
  const [linkedin, setLinkedin] = useState(null) // { connected, name, ... }
  const [connecting, setConnecting] = useState(false)

  const [query, setQuery] = useState('')
  const [generating, setGenerating] = useState(false)
  const [drafts, setDrafts] = useState(null) // { linkedin, x, instagram } editable
  const [activeTab, setActiveTab] = useState('linkedin')
  const [savingTab, setSavingTab] = useState('')

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = async () => {
    try {
      const [st, list] = await Promise.all([socialApi.getLinkedInStatus(), socialApi.listPosts()])
      setLinkedin(st)
      setPosts(list)
    } catch (err) {
      setError(err.message || 'Failed to load Social Media')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const flash = (msg) => {
    setNotice(msg)
    setTimeout(() => setNotice(''), 3000)
  }

  const handleConnect = async () => {
    setConnecting(true)
    setError('')
    try {
      const url = await socialApi.getLinkedInAuthUrl()
      window.location.href = url
    } catch (err) {
      setError(err.message || 'Could not start LinkedIn sign-in')
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    await socialApi.disconnectLinkedIn()
    load()
  }

  const handleGenerate = async () => {
    if (!query.trim()) return
    setGenerating(true)
    setError('')
    try {
      const res = await socialApi.generate(query.trim())
      setDrafts(res.posts)
      setActiveTab('linkedin')
    } catch (err) {
      setError(err.message || 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveDraft = async (platform) => {
    setSavingTab(platform)
    setError('')
    try {
      const post = await socialApi.createPost({
        platform,
        content: drafts[platform],
        prompt: query.trim(),
      })
      setPosts((list) => [post, ...list])
      flash(`${PLATFORMS[platform].label} draft saved`)
    } catch (err) {
      setError(err.message || 'Could not save draft')
    } finally {
      setSavingTab('')
    }
  }

  const replacePost = (post) => setPosts((list) => list.map((p) => (p._id === post._id ? post : p)))

  const handlePublish = async (post) => {
    setBusyId(post._id)
    setError('')
    try {
      const updated = await socialApi.publish(post._id)
      replacePost(updated)
      flash('Published to LinkedIn')
    } catch (err) {
      setError(err.message || 'Publish failed')
    } finally {
      setBusyId('')
    }
  }

  const handleMarkPosted = async (post) => {
    try {
      await navigator.clipboard?.writeText(post.content)
    } catch {
      /* clipboard may be unavailable; continue */
    }
    const postUrl = window.prompt(
      `Content copied to clipboard. Post it on ${PLATFORMS[post.platform].label}, then paste the post URL here:`
    )
    if (!postUrl) return
    setBusyId(post._id)
    setError('')
    try {
      const updated = await socialApi.markPosted(post._id, postUrl)
      replacePost(updated)
      flash('Marked as posted')
    } catch (err) {
      setError(err.message || 'Could not mark as posted')
    } finally {
      setBusyId('')
    }
  }

  const handleRefreshMetrics = async (post) => {
    setBusyId(post._id)
    setError('')
    try {
      const updated = await socialApi.refreshMetrics(post._id)
      replacePost(updated)
      flash('Metrics refreshed')
    } catch (err) {
      setError(err.message || 'Could not refresh metrics')
    } finally {
      setBusyId('')
    }
  }

  const handleEditMetrics = async (post) => {
    const likes = window.prompt('Likes:', post.metrics?.likes ?? 0)
    if (likes === null) return
    const comments = window.prompt('Comments:', post.metrics?.comments ?? 0)
    if (comments === null) return
    setBusyId(post._id)
    setError('')
    try {
      const updated = await socialApi.updatePost(post._id, {
        metrics: { likes: Number(likes) || 0, comments: Number(comments) || 0 },
      })
      replacePost(updated)
      flash('Metrics updated')
    } catch (err) {
      setError(err.message || 'Could not update metrics')
    } finally {
      setBusyId('')
    }
  }

  const handleDelete = async (post) => {
    if (!window.confirm('Delete this post?')) return
    setBusyId(post._id)
    try {
      await socialApi.deletePost(post._id)
      setPosts((list) => list.filter((p) => p._id !== post._id))
    } catch (err) {
      setError(err.message || 'Could not delete')
    } finally {
      setBusyId('')
    }
  }

  return (
    <div className="animate-[fadeIn_0.3s_ease]">
      {/* Header + LinkedIn connection */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-1 text-[22px] font-semibold text-neutral-900">Social Media Studio</h1>
          <p className="text-sm text-neutral-500">
            Generate AI posts for LinkedIn, X, and Instagram — preview, save, then publish.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {linkedin?.connected ? (
            <>
              <span className="rounded-[9px] border border-green-200 bg-green-50 px-3 py-2 text-[13px] font-medium text-green-700">
                💼 {linkedin.name || 'LinkedIn connected'}
              </span>
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
              className="rounded-[9px] bg-[#0a66c2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#004182] disabled:opacity-60"
            >
              {connecting ? 'Redirecting…' : '💼 Connect LinkedIn'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-[9px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-4 rounded-[9px] border border-green-200 bg-green-50 px-3.5 py-2.5 text-[13px] text-green-700">
          {notice}
        </div>
      )}

      <ScheduleSection />

      {/* Composer */}
      <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5">
        <label className="mb-1.5 block text-[13px] font-medium text-neutral-800">
          What do you want to post about?
        </label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={3}
          placeholder="e.g. Announce that our team just shipped a new AI feature that summarizes emails…"
          className="w-full resize-y rounded-[9px] border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400"
        />
        <div className="mt-3 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={generating || !query.trim()}
            className="rounded-[9px] bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-60"
          >
            {generating ? 'Generating…' : '✨ Generate posts'}
          </button>
        </div>

        {drafts && (
          <div className="mt-5 border-t border-neutral-100 pt-4">
            {/* Tabs */}
            <div className="mb-3 flex gap-1">
              {PLATFORM_KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium ${
                    activeTab === key
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  <span>{PLATFORMS[key].icon}</span>
                  {PLATFORMS[key].label}
                </button>
              ))}
            </div>

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
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`text-xs ${over ? 'font-semibold text-red-600' : 'text-neutral-400'}`}>
                      {drafts[key].length}/{PLATFORMS[key].limit} characters
                    </span>
                    <button
                      onClick={() => handleSaveDraft(key)}
                      disabled={savingTab === key || !drafts[key].trim()}
                      className="rounded-[9px] border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-60"
                    >
                      {savingTab === key ? 'Saving…' : '💾 Save draft'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Posts table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-100 px-5 py-[18px] text-sm font-semibold text-neutral-900">
          Your Posts
        </div>
        {loading ? (
          <div className="px-5 py-10 text-center text-[13px] text-neutral-400">Loading…</div>
        ) : posts.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="mb-2 text-3xl">📣</div>
            <div className="mb-1 text-sm font-semibold text-neutral-900">No posts yet</div>
            <div className="text-[13px] text-neutral-500">Generate and save a draft to get started.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-neutral-50">
                  {['Platform', 'Content', 'Status', 'Likes', 'Comments', 'Post URL', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => {
                  const meta = PLATFORMS[post.platform]
                  const busy = busyId === post._id
                  return (
                    <tr key={post._id} className="border-t border-neutral-100 align-top">
                      <td className="px-4 py-3.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.badge}`}>
                          {meta.icon} {meta.label}
                        </span>
                      </td>
                      <td className="max-w-[280px] px-4 py-3.5 text-[13px] text-neutral-700">
                        <div className="line-clamp-2">{post.content}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={post.status} />
                      </td>
                      <td className="px-4 py-3.5 text-[13px] font-medium text-neutral-900">{post.metrics?.likes ?? 0}</td>
                      <td className="px-4 py-3.5 text-[13px] font-medium text-neutral-900">{post.metrics?.comments ?? 0}</td>
                      <td className="max-w-[160px] px-4 py-3.5 text-[13px]">
                        {post.postUrl ? (
                          <a
                            href={post.postUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block truncate text-blue-600 hover:underline"
                            title={post.postUrl}
                          >
                            {post.postUrl}
                          </a>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1.5">
                          {post.status === 'draft' && post.platform === 'linkedin' && (
                            <button
                              onClick={() => handlePublish(post)}
                              disabled={busy}
                              className="rounded-md bg-[#0a66c2] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#004182] disabled:opacity-60"
                            >
                              {busy ? '…' : 'Publish'}
                            </button>
                          )}
                          {post.status === 'draft' && post.platform !== 'linkedin' && (
                            <button
                              onClick={() => handleMarkPosted(post)}
                              disabled={busy}
                              className="rounded-md bg-neutral-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-neutral-700 disabled:opacity-60"
                            >
                              {busy ? '…' : 'Copy & mark posted'}
                            </button>
                          )}
                          {post.status === 'posted' && post.platform === 'linkedin' && post.postUrn && (
                            <button
                              onClick={() => handleRefreshMetrics(post)}
                              disabled={busy}
                              className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-60"
                            >
                              {busy ? '…' : '⟳ Metrics'}
                            </button>
                          )}
                          {post.status === 'posted' && (
                            <button
                              onClick={() => handleEditMetrics(post)}
                              disabled={busy}
                              className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-60"
                            >
                              Edit
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(post)}
                            disabled={busy}
                            className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                          >
                            Delete
                          </button>
                        </div>
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
