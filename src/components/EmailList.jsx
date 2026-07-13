import { useState } from 'react'
import * as gmailApi from '../api/gmail'

function initialOf(from) {
  const name = (from || '?').replace(/<.*>/, '').trim()
  return (name || from || '?').charAt(0).toUpperCase()
}

function displayFrom(from) {
  return (from || '').replace(/<.*>/, '').trim() || from || 'Unknown'
}

function formatDate(d) {
  if (!d) return ''
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const chipBase =
  'rounded-full border px-2.5 py-1 text-[11px] font-medium transition disabled:opacity-50 disabled:cursor-not-allowed'

function EmailRow({ mail, onSummary, onRemove }) {
  const [summary, setSummary] = useState(mail.summary || '')
  const [busy, setBusy] = useState('')
  const [draft, setDraft] = useState(null) // null = hidden; string = editable draft
  const [notice, setNotice] = useState(null) // { type, text, link }

  const run = async (action, fn) => {
    setBusy(action)
    setNotice(null)
    try {
      await fn()
    } catch (err) {
      setNotice({ type: 'err', text: err.message || 'Action failed' })
    } finally {
      setBusy('')
    }
  }

  const handleSummarize = () =>
    run('Summarize', async () => {
      const res = await gmailApi.summarize(mail.gmailId)
      setSummary(res.summary)
      onSummary?.(mail.gmailId, res.summary)
    })

  const handleReply = () =>
    run('Reply', async () => {
      const res = await gmailApi.reply(mail.gmailId)
      setDraft(res.draft)
    })

  const handleSend = () =>
    run('Send', async () => {
      const res = await gmailApi.send(mail.gmailId, draft || '')
      setDraft(null)
      setNotice({ type: 'ok', text: `Reply sent to ${res.to}` })
    })

  const handleSchedule = () =>
    run('Schedule', async () => {
      const res = await gmailApi.schedule(mail.gmailId)
      setNotice({
        type: 'ok',
        text: res.event?.htmlLink ? 'Meeting added to your Google Calendar.' : 'Meeting scheduled.',
        link: res.event?.htmlLink,
      })
    })

  const handleDelete = () =>
    run('Delete', async () => {
      await gmailApi.trash([mail.gmailId])
      onRemove?.(mail.gmailId)
    })

  const handleBlock = () =>
    run('Block', async () => {
      const res = await gmailApi.block(mail.gmailId)
      setNotice({ type: 'ok', text: `Blocked ${res.fromEmail}` })
      onRemove?.(mail.gmailId)
    })

  return (
    <div className="border-b border-neutral-100 px-5 py-4 last:border-b-0 hover:bg-neutral-50">
      <div className="flex items-start gap-3.5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[13px] font-semibold text-white">
          {initialOf(mail.from)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[13px] font-semibold text-neutral-900">{displayFrom(mail.from)}</span>
            {mail.unread && <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />}
            <span className="ml-auto flex-shrink-0 text-xs text-neutral-400">{formatDate(mail.date)}</span>
          </div>
          <div className="truncate text-[13px] font-medium text-neutral-800">{mail.subject || '(no subject)'}</div>
          <div className="truncate text-[13px] text-neutral-500">{mail.snippet}</div>

          {summary && (
            <div className="mt-2 rounded-lg bg-neutral-100 px-3 py-2 text-[12px] text-neutral-700">
              <span className="font-semibold text-neutral-900">AI:</span> {summary}
            </div>
          )}

          {draft !== null && (
            <div className="mt-2 rounded-lg border border-neutral-200 bg-white p-2">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                Draft reply (editable)
              </div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={4}
                className="w-full resize-y rounded-md border border-neutral-200 p-2 text-[12px] text-neutral-800 outline-none focus:border-neutral-400"
              />
              <div className="mt-1.5 flex gap-2">
                <button
                  onClick={handleSend}
                  disabled={Boolean(busy) || !draft.trim()}
                  className={`${chipBase} border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-700`}
                >
                  {busy === 'Send' ? 'Sending…' : '➤ Send'}
                </button>
                <button
                  onClick={() => setDraft(null)}
                  disabled={Boolean(busy)}
                  className={`${chipBase} border-neutral-300 text-neutral-600 hover:bg-neutral-100`}
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          {notice && (
            <div className={`mt-2 text-[12px] ${notice.type === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
              {notice.text}
              {notice.link && (
                <>
                  {' '}
                  <a href={notice.link} target="_blank" rel="noreferrer" className="underline">
                    View event
                  </a>
                </>
              )}
            </div>
          )}

          {/* Suggested-action chips */}
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button onClick={handleSummarize} disabled={Boolean(busy)} className={`${chipBase} border-neutral-300 text-neutral-700 hover:bg-neutral-100`}>
              {busy === 'Summarize' ? 'Summarizing…' : '✨ Summarize'}
            </button>
            <button onClick={handleReply} disabled={Boolean(busy)} className={`${chipBase} border-neutral-300 text-neutral-700 hover:bg-neutral-100`}>
              {busy === 'Reply' ? 'Drafting…' : '↩ Reply'}
            </button>
            <button onClick={handleSchedule} disabled={Boolean(busy)} className={`${chipBase} border-neutral-300 text-neutral-700 hover:bg-neutral-100`}>
              {busy === 'Schedule' ? 'Scheduling…' : '📅 Schedule'}
            </button>
            <button onClick={handleBlock} disabled={Boolean(busy)} className={`${chipBase} border-amber-300 text-amber-700 hover:bg-amber-50`}>
              {busy === 'Block' ? 'Blocking…' : '🚫 Block'}
            </button>
            <button onClick={handleDelete} disabled={Boolean(busy)} className={`${chipBase} border-red-300 text-red-600 hover:bg-red-50`}>
              {busy === 'Delete' ? 'Deleting…' : '🗑 Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EmailList({ messages, onSummary, onRemove, compact = false }) {
  if (!messages?.length) {
    return (
      <div className="px-5 py-10 text-center text-[13px] text-neutral-400">
        No emails yet. Hit <span className="font-medium text-neutral-600">Sync</span> to pull your inbox.
      </div>
    )
  }

  if (compact) {
    return (
      <div>
        {messages.map((mail) => (
          <div key={mail.gmailId} className="flex items-start gap-3 border-b border-neutral-100 px-5 py-3 last:border-b-0">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[12px] font-semibold text-white">
              {initialOf(mail.from)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-[13px] font-semibold text-neutral-900">{displayFrom(mail.from)}</span>
                <span className="ml-auto flex-shrink-0 text-[11px] text-neutral-400">{formatDate(mail.date)}</span>
              </div>
              <div className="truncate text-[13px] text-neutral-600">{mail.subject || '(no subject)'}</div>
              {mail.summary && <div className="truncate text-[12px] text-neutral-400">✨ {mail.summary}</div>}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {messages.map((mail) => (
        <EmailRow key={mail.gmailId} mail={mail} onSummary={onSummary} onRemove={onRemove} />
      ))}
    </div>
  )
}
