import { useEffect, useRef, useState } from 'react'
import * as memesApi from '../api/memes'

// Same-origin template assets (in /public/memes) — same-origin keeps the canvas
// untainted so toDataURL() works for Download and Post. If an image file is
// missing, the canvas falls back to a colored background with the label.
const TEMPLATES = [
  { key: 'drake', label: 'Drake', src: '/memes/drake.jpg', bg: '#f4c542' },
  { key: 'distracted-boyfriend', label: 'Distracted Boyfriend', src: '/memes/distracted-boyfriend.jpg', bg: '#7aa2c4' },
  { key: 'two-buttons', label: 'Two Buttons', src: '/memes/two-buttons.jpg', bg: '#e07a5f' },
  { key: 'change-my-mind', label: 'Change My Mind', src: '/memes/change-my-mind.jpg', bg: '#81b29a' },
  { key: 'expanding-brain', label: 'Expanding Brain', src: '/memes/expanding-brain.jpg', bg: '#9d8df1' },
  { key: 'one-does-not-simply', label: 'One Does Not Simply', src: '/memes/one-does-not-simply.jpg', bg: '#3d405b' },
]

const PLATFORMS = {
  linkedin: { label: 'LinkedIn', icon: '💼' },
  x: { label: 'X', icon: '𝕏' },
  instagram: { label: 'Instagram', icon: '📸' },
}
const PLATFORM_KEYS = ['linkedin', 'x', 'instagram']

const CANVAS_MAX_W = 700

const H_OPTIONS = [
  ['left', 'Left'],
  ['center', 'Center'],
  ['right', 'Right'],
]
const V_OPTIONS = [
  ['top', 'Top'],
  ['center', 'Center'],
  ['bottom', 'Bottom'],
]

// Wrap text to maxW, breaking on spaces and hard-breaking any single word that
// is itself wider than the line (so long unbroken strings don't overflow).
function wrapText(ctx, value, maxW) {
  const lines = []
  let current = ''
  for (let word of value.split(/\s+/)) {
    // Hard-break a word that can't fit on a line on its own.
    while (ctx.measureText(word).width > maxW) {
      if (current) {
        lines.push(current)
        current = ''
      }
      let take = 1
      for (let n = 1; n <= word.length; n++) {
        if (ctx.measureText(word.slice(0, n)).width <= maxW) take = n
        else break
      }
      lines.push(word.slice(0, take))
      word = word.slice(take)
    }
    if (!word) continue
    const test = current ? `${current} ${word}` : word
    if (current && ctx.measureText(test).width > maxW) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

// Draw wrapped, Impact-style caption text at the given horizontal (left/center/
// right) and vertical (top/center/bottom) alignment.
function drawCaption(ctx, text, canvasW, canvasH, hAlign = 'center', vAlign = 'top') {
  const value = (text || '').trim().toUpperCase()
  if (!value) return

  const fontSize = Math.round(canvasW / 11)
  ctx.font = `bold ${fontSize}px Impact, "Arial Black", sans-serif`
  ctx.fillStyle = '#fff'
  ctx.strokeStyle = '#000'
  ctx.lineWidth = Math.max(2, fontSize / 12)
  ctx.lineJoin = 'round'

  const pad = fontSize * 0.35
  const maxW = canvasW - pad * 2

  const lines = wrapText(ctx, value, maxW)

  const lineHeight = fontSize * 1.1
  const blockH = lines.length * lineHeight

  // Horizontal placement.
  let x
  if (hAlign === 'left') {
    ctx.textAlign = 'left'
    x = pad
  } else if (hAlign === 'right') {
    ctx.textAlign = 'right'
    x = canvasW - pad
  } else {
    ctx.textAlign = 'center'
    x = canvasW / 2
  }

  // Vertical placement — anchor the top of the text block, then stack downward.
  ctx.textBaseline = 'top'
  let startY
  if (vAlign === 'center') startY = (canvasH - blockH) / 2
  else if (vAlign === 'bottom') startY = canvasH - pad - blockH
  else startY = pad

  lines.forEach((line, i) => {
    const y = startY + i * lineHeight
    ctx.strokeText(line, x, y)
    ctx.fillText(line, x, y)
  })
}

// One caption input plus its horizontal + vertical alignment dropdowns.
function CaptionField({ label, value, onChange, hAlign, setHAlign, vAlign, setVAlign, inputCls }) {
  const selectCls = `${inputCls} py-1.5 text-[13px]`
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-neutral-800">{label}</label>
      <input value={value} onChange={onChange} className={inputCls} />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <select value={hAlign} onChange={(e) => setHAlign(e.target.value)} className={selectCls}>
          {H_OPTIONS.map(([v, l]) => (
            <option key={v} value={v}>
              ↔ {l}
            </option>
          ))}
        </select>
        <select value={vAlign} onChange={(e) => setVAlign(e.target.value)} className={selectCls}>
          {V_OPTIONS.map(([v, l]) => (
            <option key={v} value={v}>
              ↕ {l}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default function MemeGenerator() {
  const [mode, setMode] = useState('template') // 'template' | 'ai'
  const [templateKey, setTemplateKey] = useState(TEMPLATES[0].key)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiImageSrc, setAiImageSrc] = useState('') // data: URL from the backend
  const [generatingImage, setGeneratingImage] = useState(false)

  const [topText, setTopText] = useState('')
  const [bottomText, setBottomText] = useState('')
  const [topH, setTopH] = useState('center')
  const [topV, setTopV] = useState('top')
  const [bottomH, setBottomH] = useState('center')
  const [bottomV, setBottomV] = useState('bottom')
  const [topic, setTopic] = useState('')
  const [suggesting, setSuggesting] = useState(false)

  const [caption, setCaption] = useState('') // LinkedIn post commentary
  const [platform, setPlatform] = useState('linkedin')
  const [posting, setPosting] = useState(false)

  const [linkedin, setLinkedin] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const canvasRef = useRef(null)
  const imgCacheRef = useRef({ src: '', img: null })

  useEffect(() => {
    memesApi
      .getLinkedInStatus()
      .then(setLinkedin)
      .catch(() => setLinkedin({ connected: false }))
  }, [])

  const flash = (msg) => {
    setNotice(msg)
    setTimeout(() => setNotice(''), 3500)
  }

  // The base image src for whichever mode is active.
  const activeTemplate = TEMPLATES.find((t) => t.key === templateKey) || TEMPLATES[0]
  const baseSrc = mode === 'ai' ? aiImageSrc : activeTemplate.src

  // Redraw the meme whenever inputs change.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const paint = (img) => {
      const naturalW = img?.naturalWidth || CANVAS_MAX_W
      const naturalH = img?.naturalHeight || Math.round(CANVAS_MAX_W * 0.75)
      const scale = Math.min(1, CANVAS_MAX_W / naturalW)
      canvas.width = Math.round(naturalW * scale)
      canvas.height = Math.round(naturalH * scale)

      if (img) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      } else {
        // Fallback background (template image missing / AI not generated yet).
        ctx.fillStyle = mode === 'ai' ? '#1f2937' : activeTemplate.bg
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = 'rgba(255,255,255,0.85)'
        ctx.font = `bold ${Math.round(canvas.width / 16)}px Arial, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(
          mode === 'ai' ? 'Generate an image →' : activeTemplate.label,
          canvas.width / 2,
          canvas.height / 2
        )
      }
      drawCaption(ctx, topText, canvas.width, canvas.height, topH, topV)
      drawCaption(ctx, bottomText, canvas.width, canvas.height, bottomH, bottomV)
    }

    if (!baseSrc) {
      paint(null)
      return
    }
    if (imgCacheRef.current.src === baseSrc && imgCacheRef.current.img) {
      paint(imgCacheRef.current.img)
      return
    }
    const img = new Image()
    img.onload = () => {
      imgCacheRef.current = { src: baseSrc, img }
      paint(img)
    }
    img.onerror = () => {
      imgCacheRef.current = { src: '', img: null }
      paint(null) // draw the labeled fallback background instead
    }
    img.src = baseSrc
  }, [baseSrc, topText, bottomText, topH, topV, bottomH, bottomV, mode, activeTemplate])

  const handleSuggest = async () => {
    if (!topic.trim()) return
    setSuggesting(true)
    setError('')
    try {
      const { top, bottom } = await memesApi.suggestCaptions(topic.trim())
      setTopText(top || '')
      setBottomText(bottom || '')
    } catch (err) {
      setError(err.message || 'Could not suggest captions')
    } finally {
      setSuggesting(false)
    }
  }

  const handleGenerateImage = async () => {
    if (!aiPrompt.trim()) return
    setGeneratingImage(true)
    setError('')
    try {
      const { imageBase64, mimeType } = await memesApi.generateImage(aiPrompt.trim())
      setAiImageSrc(`data:${mimeType || 'image/png'};base64,${imageBase64}`)
    } catch (err) {
      setError(err.message || 'Image generation failed')
    } finally {
      setGeneratingImage(false)
    }
  }

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'meme.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const handleConnect = async () => {
    setConnecting(true)
    setError('')
    try {
      const url = await memesApi.getLinkedInAuthUrl()
      window.location.href = url
    } catch (err) {
      setError(err.message || 'Could not start LinkedIn sign-in')
      setConnecting(false)
    }
  }

  const handlePost = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (platform === 'linkedin' && !linkedin?.connected) {
      setError('Connect LinkedIn first to post there.')
      return
    }
    setPosting(true)
    setError('')
    try {
      const imageBase64 = canvas.toDataURL('image/png')
      const res = await memesApi.postMeme({ imageBase64, caption: caption.trim(), platform })
      if (res?.manual) {
        handleDownload()
        flash(`Meme downloaded — post it manually on ${PLATFORMS[platform].label}.`)
      } else if (res?.post?.postUrl) {
        flash('Published to LinkedIn 🎉')
        window.open(res.post.postUrl, '_blank', 'noreferrer')
      } else {
        flash('Posted')
      }
    } catch (err) {
      setError(err.message || 'Could not post the meme')
    } finally {
      setPosting(false)
    }
  }

  const inputCls =
    'w-full rounded-[9px] border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400'

  return (
    <div className="animate-[fadeIn_0.3s_ease]">
      {/* Header + LinkedIn connection */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-1 text-[22px] font-semibold text-neutral-900">Memes Generator</h1>
          <p className="text-sm text-neutral-500">
            Caption a classic template or generate an AI meme — then download or post it.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {linkedin?.connected ? (
            <span className="rounded-[9px] border border-green-200 bg-green-50 px-3 py-2 text-[13px] font-medium text-green-700">
              💼 {linkedin.name || 'LinkedIn connected'}
            </span>
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

      {/* Mode tabs */}
      <div className="mb-4 flex gap-1">
        {[
          { key: 'template', label: '🖼 Template' },
          { key: 'ai', label: '✨ AI Image' },
        ].map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={`rounded-lg px-3.5 py-1.5 text-[13px] font-medium ${
              mode === m.key
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Controls */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          {mode === 'template' ? (
            <>
              <label className="mb-1.5 block text-[13px] font-medium text-neutral-800">Template</label>
              <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTemplateKey(t.key)}
                    className={`rounded-[9px] border px-2.5 py-2 text-[12px] font-medium ${
                      templateKey === t.key
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <label className="mb-1.5 block text-[13px] font-medium text-neutral-800">
                Describe the meme image
              </label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
                placeholder="e.g. a cat in a business suit looking stressed at a laptop"
                className={`${inputCls} resize-y`}
              />
              <div className="mb-4 mt-3 flex justify-end">
                <button
                  onClick={handleGenerateImage}
                  disabled={generatingImage || !aiPrompt.trim()}
                  className="rounded-[9px] bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-60"
                >
                  {generatingImage ? 'Generating…' : '✨ Generate image'}
                </button>
              </div>
            </>
          )}

          {/* AI caption suggestion */}
          <label className="mb-1.5 block text-[13px] font-medium text-neutral-800">
            Caption ideas (optional)
          </label>
          <div className="mb-4 flex gap-2">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic, e.g. Monday mornings"
              className={inputCls}
            />
            <button
              onClick={handleSuggest}
              disabled={suggesting || !topic.trim()}
              className="whitespace-nowrap rounded-[9px] border border-neutral-200 px-3.5 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-60"
            >
              {suggesting ? '…' : '✨ Suggest'}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CaptionField
              label="Top text"
              value={topText}
              onChange={(e) => setTopText(e.target.value)}
              hAlign={topH}
              setHAlign={setTopH}
              vAlign={topV}
              setVAlign={setTopV}
              inputCls={inputCls}
            />
            <CaptionField
              label="Bottom text"
              value={bottomText}
              onChange={(e) => setBottomText(e.target.value)}
              hAlign={bottomH}
              setHAlign={setBottomH}
              vAlign={bottomV}
              setVAlign={setBottomV}
              inputCls={inputCls}
            />
          </div>
        </div>

        {/* Preview + actions */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="mb-3 text-[13px] font-medium text-neutral-800">Preview</div>
          <div className="flex justify-center rounded-[9px] bg-neutral-50 p-3">
            <canvas ref={canvasRef} className="max-w-full rounded-md" />
          </div>

          <label className="mb-1.5 mt-4 block text-[13px] font-medium text-neutral-800">
            Post caption (optional)
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={2}
            placeholder="Text posted alongside the image (LinkedIn)…"
            className={`${inputCls} resize-y`}
          />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownload}
              className="rounded-[9px] border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            >
              ⬇ Download
            </button>
            <div className="ml-auto flex items-center gap-2">
              <select value={platform} onChange={(e) => setPlatform(e.target.value)} className={`${inputCls} w-auto`}>
                {PLATFORM_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {PLATFORMS[k].icon} {PLATFORMS[k].label}
                  </option>
                ))}
              </select>
              <button
                onClick={handlePost}
                disabled={posting}
                className="rounded-[9px] bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-60"
              >
                {posting ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>
          {platform !== 'linkedin' && (
            <p className="mt-2 text-[11px] text-neutral-400">
              X and Instagram have no direct image API here — “Post” downloads the meme so you can share it manually.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
