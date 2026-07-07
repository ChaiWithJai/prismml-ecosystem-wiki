'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

type Doc = { title: string; url: string; text: string }
type Trace = {
  sources: { title: string; url: string }[]
  contextChars: number
  inputTokens?: number
  ttftMs?: number
  tokensPerSecond?: number
  outputTokens?: number
  dtype?: string
}
type ChatMsg = {
  role: 'user' | 'assistant'
  content: string
  trace?: Trace
}
type Phase = 'retrieve' | 'assemble' | 'prefill' | 'decode' | 'done'
// The chat's finite states. Every UI element derives from exactly one of
// these plus (during loading) a progress fraction, so no transition can
// strand the reader in an in-between screen.
type ChatState =
  | 'boot' // deciding: WebGPU there? wormhole query there?
  | 'unsupported' // no WebGPU
  | 'invite' // supported, nothing loaded, waiting for intent
  | 'loading' // corpus + model download + compile
  | 'ready' // model warm, waiting for a question
  | 'generating' // a question is in flight
  | 'error'

const SYSTEM_PROMPT = `You are the PrismML docs assistant. You answer questions about PrismML, the Bonsai models, and the tools that run them, using ONLY the documentation excerpts provided in the user message.

Rules:
- Answer from the excerpts. If they do not contain the answer, say "The docs do not cover that yet" and suggest the closest page.
- Keep answers under 120 words. Use plain sentences.
- Quote exact numbers from the excerpts. Never invent a number, a version, or a URL.
- Numbers labeled discovery or unconfirmed must be repeated with that label.
- Link pages as markdown links with site-relative paths, e.g. [runtime map](/docs/build-and-run/runtime-map).`

const SUGGESTIONS = [
  'How big is the Bonsai 8B GGUF file?',
  'What license are the Bonsai models under?',
  'How much energy per token does Bonsai use on a Mac M4 Pro with MLX?',
  'Does compressing weights shrink the KV cache?',
]

// Normalize any URL the model may have copied from its context into a clean
// site-relative route: strip our hosts and the .md twin suffix.
function cleanUrl(url: string): string {
  return url
    .replace(/^https?:\/\/(yourwildcard\.ai|prismml-ecosystem-wiki\.netlify\.app)/, '')
    .replace(/\.md$/, '')
}

function chunkCorpus(fullText: string): Doc[] {
  const docs: Doc[] = []
  for (const block of fullText.split('\n\n---\n\n')) {
    const url = block.match(/canonical_url:\s*(\S+)/)?.[1]
    const title = block.match(/^#\s+(.+)$/m)?.[1] ?? block.match(/title:\s*(.+)/)?.[1]
    if (!url || !title) continue
    const body = block
      .replace(/^---[\s\S]*?---\n/, '')
      // the llms-full bundle links .md twins; give the model clean routes so
      // the links it repeats back are the ones a reader can click
      .replace(/\]\((https?:\/\/[^)\s]+)\)/g, (_, u) => `](${cleanUrl(u)})`)
      .replace(/^> Full documentation index.*$/m, '')
      .replace(/^> Use it to discover.*$/m, '')
      .trim()
    docs.push({ title: title.trim(), url: cleanUrl(url), text: body })
  }
  return docs
}

function countHits(hay: string, term: string) {
  return Math.min(hay.split(term).length - 1, 5)
}

// IDF-weighted retrieval with paragraph-window excerpts. Tuned against a
// gold-question eval run on Bonsai 8B locally; see the docs-chat page.
function retrieve(docs: Doc[], query: string, k = 2): Doc[] {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9.]+/)
    .filter((t) => t.length >= 2)
  const N = docs.length
  const idf: Record<string, number> = {}
  for (const t of terms) {
    const df = docs.filter((d) => d.text.toLowerCase().includes(t)).length
    idf[t] = Math.log(N / Math.max(1, df))
  }
  const scored = docs.map((d) => {
    const hay = d.text.toLowerCase()
    const title = d.title.toLowerCase()
    let score = 0
    for (const t of terms) {
      score += countHits(hay, t) * idf[t]
      if (title.includes(t)) score += 4 * idf[t]
    }
    return { d, score }
  })
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .filter((s) => s.score > 0)
    .map((s) => ({ ...s.d, text: excerpt(s.d.text, terms, idf) }))
}

function excerpt(text: string, terms: string[], idf: Record<string, number>, budget = 2400) {
  const paras = text.split('\n\n').filter((p) => p.trim())
  const scored = paras.map((p, j) => {
    const pl = p.toLowerCase()
    let s = 0
    for (const t of terms) s += countHits(pl, t) * idf[t]
    return { s, j, p }
  })
  const keep = new Set<number>()
  let used = 0
  for (const { s, j, p } of [...scored].sort((a, b) => b.s - a.s)) {
    if (s <= 0 || used >= budget) break
    keep.add(j)
    used += p.length
  }
  if (keep.size === 0) return text.slice(0, budget)
  return paras
    .filter((_, j) => keep.has(j))
    .join('\n\n')
    .slice(0, budget + 800)
}

// Minimal markdown for model output: links, inline code, bold. The model is
// instructed to emit only these; anything else renders as written.
function AnswerText({ text }: { text: string }) {
  const nodes: React.ReactNode[] = []
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`|\*\*([^*]+)\*\*/g
  let last = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    if (m[1] !== undefined) {
      const href = cleanUrl(m[2])
      const inner = m[1]
      nodes.push(
        href.startsWith('/') ? (
          <Link key={key++} href={href} className="font-medium text-violet-700 hover:underline dark:text-violet-400">
            {inner}
          </Link>
        ) : (
          <a key={key++} href={href} className="font-medium text-violet-700 hover:underline dark:text-violet-400">
            {inner}
          </a>
        ),
      )
    } else if (m[3] !== undefined) {
      nodes.push(
        <code key={key++} className="rounded bg-slate-100 px-1 py-0.5 text-[0.85em] dark:bg-slate-800">
          {m[3]}
        </code>,
      )
    } else if (m[4] !== undefined) {
      nodes.push(
        <strong key={key++} className="font-semibold">
          {m[4]}
        </strong>,
      )
    }
    last = m.index + m[0].length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200">{nodes}</p>
}

// The inference trace: the visible inference surface is where users learn
// why 1-bit is different. Each stage names the design decision behind it
// and shows the number measured live.
const STAGE_META: { key: Phase; label: string; design: string }[] = [
  {
    key: 'retrieve',
    label: 'Retrieve',
    design: 'IDF keyword search over every docs page. Rare words weigh more, so "KV" beats "Bonsai".',
  },
  {
    key: 'assemble',
    label: 'Assemble',
    design: 'Question first, then short excerpts. Our eval showed the model misses answers when the question comes last.',
  },
  {
    key: 'prefill',
    label: 'Prefill',
    design: 'The whole prompt is processed in one parallel pass and written into the KV cache.',
  },
  {
    key: 'decode',
    label: 'Decode',
    design: 'One token per step. Each step reads the KV cache (~112 KB per token) and streams all 290 MB of 1-bit weights through your GPU.',
  },
]

function InferenceTrace({ phase, trace, compact }: { phase: Phase; trace: Trace; compact?: boolean }) {
  const order: Phase[] = ['retrieve', 'assemble', 'prefill', 'decode', 'done']
  const activeIdx = order.indexOf(phase)
  const value = (key: Phase): string => {
    if (key === 'retrieve')
      return trace.sources.length ? trace.sources.map((s) => s.title).join(', ') : 'no matching pages'
    if (key === 'assemble') return `${trace.contextChars.toLocaleString()} chars of excerpts`
    if (key === 'prefill')
      return trace.inputTokens
        ? `${trace.inputTokens.toLocaleString()} tokens${trace.ttftMs ? ` -> first token in ${(trace.ttftMs / 1000).toFixed(1)}s` : ''}`
        : 'waiting'
    if (key === 'decode')
      return trace.tokensPerSecond ? `${trace.tokensPerSecond.toFixed(0)} tok/s on your GPU` : 'streaming'
    return ''
  }
  return (
    <div className={compact ? 'mt-2' : 'mt-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700'}>
      <ol className="space-y-2">
        {STAGE_META.map((s, i) => {
          const state = i < activeIdx ? 'done' : i === activeIdx ? 'active' : 'pending'
          return (
            <li key={s.key} className="flex gap-2 text-xs">
              <span
                className={
                  state === 'active'
                    ? 'mt-0.5 h-2 w-2 shrink-0 rounded-full bg-violet-500 motion-safe:animate-pulse'
                    : state === 'done'
                      ? 'mt-0.5 h-2 w-2 shrink-0 rounded-full bg-violet-600 dark:bg-violet-500'
                      : 'mt-0.5 h-2 w-2 shrink-0 rounded-full bg-slate-300 dark:bg-slate-600'
                }
              />
              <span className={state === 'pending' ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'}>
                <span className="font-semibold">{s.label}.</span>{' '}
                {state !== 'pending' && (
                  <span className="text-violet-700 dark:text-violet-400" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {value(s.key)}
                  </span>
                )}{' '}
                {!compact && <span className="text-slate-500 dark:text-slate-400">{s.design}</span>}
              </span>
            </li>
          )
        })}
      </ol>
      {phase === 'done' && (
        <p className="mt-3 border-t border-slate-200 pt-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
          <span className="font-semibold text-violet-700 dark:text-violet-400">Intelligence density: 2.832 per GB.</span>{' '}
          The whitepaper's benchmark of capability per gigabyte; 1-bit Bonsai 1.7B leads every model it was compared
          against.{' '}
          <Link href="/docs/prismml/whitepaper-benchmarks" className="font-medium underline">
            See the benchmark
          </Link>{' '}
          &middot;{' '}
          <Link href="/docs/learning-paths/designing-the-docs-chat" className="font-medium underline">
            Extend this demo
          </Link>
        </p>
      )}
    </div>
  )
}

export function DocsChat() {
  const [state, setState] = useState<ChatState>('boot')
  const [progress, setProgress] = useState('')
  const [progressPct, setProgressPct] = useState<number | null>(null)
  const [dtype, setDtype] = useState('')
  const [device, setDevice] = useState('')
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [errorText, setErrorText] = useState('')
  const searchParams = useSearchParams()
  const wormholeQ = searchParams.get('q')
  const queuedAsk = useRef<string | null>(null)
  const startedRef = useRef(false)
  const workerRef = useRef<Worker | null>(null)
  const docsRef = useRef<Doc[]>([])
  const pendingTrace = useRef<Trace>({ sources: [], contextChars: 0 })
  const [livePhase, setLivePhase] = useState<Phase>('done')
  const [liveTrace, setLiveTrace] = useState<Trace | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    return () => workerRef.current?.terminate()
  }, [])

  // Boot decision: figure out support once, and honor a wormhole query by
  // showing it as a message immediately and starting the load unprompted.
  useEffect(() => {
    if (state !== 'boot') return
    if (typeof navigator !== 'undefined' && !('gpu' in navigator)) {
      setState('unsupported')
      return
    }
    if (wormholeQ && !startedRef.current) {
      queueAsk(wormholeQ)
      begin()
    } else {
      setState('invite')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, wormholeQ])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, liveTrace])

  function queueAsk(q: string) {
    queuedAsk.current = q
    setMessages((prev) => [...prev, { role: 'user', content: q }, { role: 'assistant', content: '' }])
  }

  async function begin() {
    if (startedRef.current) return
    startedRef.current = true
    setState('loading')
    setProgress('Fetching the docs index…')
    try {
      const corpus = await fetch('/llms-full.txt').then((r) => r.text())
      docsRef.current = chunkCorpus(corpus)
    } catch {
      setErrorText('Could not fetch /llms-full.txt.')
      setState('error')
      return
    }
    const worker = new Worker('/chat-worker.mjs', { type: 'module' })
    workerRef.current = worker
    worker.onmessage = (e) => {
      const m = e.data
      if (m.type === 'progress') {
        const pct = Math.round((m.loaded / m.total) * 100)
        const mb = (m.total / 1024 / 1024).toFixed(0)
        setProgressPct(pct)
        setProgress(`Downloading the model — ${mb} MB, one time; cached after`)
      } else if (m.type === 'status') {
        setProgressPct(null)
        setProgress(m.text)
      } else if (m.type === 'ready') {
        setDtype(m.dtype)
        setDevice(m.device ?? 'webgpu')
        setProgressPct(null)
        if (queuedAsk.current) {
          const q = queuedAsk.current
          queuedAsk.current = null
          runAsk(q, false)
        } else {
          setState('ready')
        }
      } else if (m.type === 'phase') {
        if (m.phase === 'prefill') {
          pendingTrace.current = { ...pendingTrace.current, inputTokens: m.inputTokens }
          setLivePhase('prefill')
        } else if (m.phase === 'decode') {
          pendingTrace.current = { ...pendingTrace.current, ttftMs: m.ttftMs }
          setLivePhase('decode')
        }
        setLiveTrace({ ...pendingTrace.current })
      } else if (m.type === 'token') {
        setMessages((prev) => {
          const next = [...prev]
          const last = next[next.length - 1]
          if (last?.role === 'assistant') last.content += m.text
          return next
        })
      } else if (m.type === 'done') {
        const finalTrace: Trace = {
          ...pendingTrace.current,
          ttftMs: m.ttftMs ?? pendingTrace.current.ttftMs,
          tokensPerSecond: m.tokensPerSecond,
          outputTokens: m.outputTokens,
          dtype: m.dtype,
        }
        setMessages((prev) => {
          const next = [...prev]
          const last = next[next.length - 1]
          if (last?.role === 'assistant') last.trace = finalTrace
          return next
        })
        setLivePhase('done')
        setLiveTrace(null)
        setState('ready')
      } else if (m.type === 'error') {
        setErrorText(m.message)
        setState('error')
      }
    }
    setProgress('Starting the 1-bit Bonsai 1.7B download…')
    worker.postMessage({ type: 'load' })
  }

  // One entry point for every ask. push=true appends the message pair;
  // queued asks already pushed theirs when the reader typed them.
  function runAsk(q: string, push: boolean) {
    const hits = retrieve(docsRef.current, q)
    const context = hits.map((h) => `### ${h.title} (${h.url})\n${h.text}`).join('\n\n')
    pendingTrace.current = {
      sources: hits.map((h) => ({ title: h.title, url: h.url })),
      contextChars: context.length,
    }
    setLivePhase('assemble')
    setLiveTrace({ ...pendingTrace.current })
    const userMsg = `Question: ${q}\n\nAnswer using only these documentation excerpts:\n\n${context || '(no matching pages found)'}`
    const history = messages
      .filter((m) => m.content)
      .slice(-4)
      .map((m) => ({ role: m.role, content: m.content }))
    if (push) {
      setMessages((prev) => [...prev, { role: 'user', content: q }, { role: 'assistant', content: '' }])
    }
    setState('generating')
    workerRef.current?.postMessage({
      type: 'generate',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history, { role: 'user', content: userMsg }],
    })
  }

  function submit(q?: string) {
    const question = (q ?? input).trim()
    if (!question) return
    setInput('')
    if (state === 'ready') {
      runAsk(question, true)
    } else if (state === 'invite') {
      queueAsk(question)
      begin()
    } else if (state === 'loading') {
      if (!queuedAsk.current) queueAsk(question)
    }
    // generating: the input is disabled, so this branch never fires
  }

  const chatVisible = state === 'loading' || state === 'ready' || state === 'generating'
  const inputEnabled = state === 'invite' || state === 'ready' || (state === 'loading' && !queuedAsk.current)

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col px-4 py-8">
      <h1 className="font-display text-3xl tracking-tight text-slate-900 dark:text-white">Ask the docs</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        1-bit Bonsai 1.7B answers from these docs, running entirely in your browser over WebGPU. Nothing you type
        leaves your device.{' '}
        <Link href="/docs/build-and-run/docs-chat" className="font-medium text-violet-700 dark:text-violet-400">
          How it works
        </Link>
      </p>

      {state === 'unsupported' && (
        <div className="mt-8 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
          This browser does not expose WebGPU, which the chat needs to run the model locally. Recent Chrome, Edge, or
          Safari works. You can still read everything by hand, or point a coding agent at{' '}
          <Link href="/docs/start-here/use-with-ai" className="font-medium underline">
            the agent pathway
          </Link>
          .
        </div>
      )}

      {state === 'error' && (
        <div className="mt-8 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          The model could not start: {errorText}. A page refresh sometimes clears a stuck GPU context. If it keeps
          failing,{' '}
          <Link href="/docs/contribute/contributor-guide" className="font-medium underline">
            report it with your browser and GPU
          </Link>
          .
        </div>
      )}

      {state === 'invite' && messages.length === 0 && (
        <div className="mt-6 rounded-lg border border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          <p>
            Ask anything below — the first question also downloads the 290 MB model (one time; cached after). These
            are the gold test cases the agent is benchmarked on:
          </p>
          <ul className="mt-2 space-y-1">
            {SUGGESTIONS.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => submit(s)}
                  className="text-left font-medium text-violet-700 hover:underline dark:text-violet-400"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {chatVisible && (
        <div
          ref={scrollRef}
          className="mt-6 flex-1 space-y-4 overflow-y-auto rounded-lg border border-slate-200 p-4 dark:border-slate-700"
          style={{ minHeight: messages.length ? undefined : 120, maxHeight: '55vh' }}
        >
          {device === 'wasm' && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
              WebGPU could not start on this device, so the model is running on a CPU fallback (WASM). It works, but
              answers will stream noticeably slower than on WebGPU.
            </div>
          )}
          {state === 'ready' && messages.length === 0 && (
            <div className="text-sm text-slate-500 dark:text-slate-400">
              <p>Model loaded ({dtype === 'q1' ? '1-bit' : dtype} build). Try one:</p>
              <ul className="mt-2 space-y-1">
                {SUGGESTIONS.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => submit(s)}
                      className="text-left font-medium text-violet-700 hover:underline dark:text-violet-400"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {messages.map((m, i) => {
            const isLast = i === messages.length - 1
            const isWaitingBubble = m.role === 'assistant' && !m.content && isLast
            return (
              <div key={i}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  {m.role === 'user' ? 'You' : 'Bonsai 1.7B'}
                </p>
                {m.content ? (
                  m.role === 'assistant' ? (
                    <AnswerText text={m.content} />
                  ) : (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200">{m.content}</p>
                  )
                ) : isWaitingBubble && state === 'loading' ? (
                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    <p>
                      <span className="mr-2 inline-block h-2 w-2 rounded-full bg-violet-500 motion-safe:animate-pulse" />
                      {progress}
                    </p>
                    {progressPct !== null && (
                      <div className="mt-2 h-1.5 w-56 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div
                          className="h-full rounded-full bg-violet-500 transition-[width] duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    )}
                    <p className="mt-1 text-xs">Your question is queued; it fires the moment the model is warm.</p>
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {state === 'generating' && isLast ? '…' : ''}
                  </p>
                )}
                {m.trace && m.trace.sources.length > 0 && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Sources:{' '}
                    {m.trace.sources.map((s, j) => (
                      <span key={s.url}>
                        {j > 0 && ' · '}
                        <Link href={s.url} className="font-medium text-violet-700 hover:underline dark:text-violet-400">
                          {s.title}
                        </Link>
                      </span>
                    ))}
                  </p>
                )}
                {m.trace && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-xs font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
                      How this answer was made
                      {m.trace.tokensPerSecond ? ` — ${m.trace.tokensPerSecond.toFixed(0)} tok/s` : ''}
                    </summary>
                    <InferenceTrace phase="done" trace={m.trace} />
                  </details>
                )}
              </div>
            )
          })}
          {state === 'generating' && liveTrace && <InferenceTrace phase={livePhase} trace={liveTrace} />}
        </div>
      )}

      {state !== 'unsupported' && state !== 'error' && (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
            className="mt-4 flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!inputEnabled}
              placeholder={
                state === 'loading'
                  ? queuedAsk.current
                    ? 'Model loading — your question is queued…'
                    : 'Model loading — you can type your question now…'
                  : 'Ask about Bonsai, runtimes, or the whitepaper…'
              }
              className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={state === 'generating'}
              className="rounded-full bg-violet-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
            >
              {state === 'generating' ? 'Thinking…' : 'Ask'}
            </button>
          </form>
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
            A 1.7B model can misread things. Every answer links its source pages; check them before you quote a
            number.
          </p>
        </>
      )}
    </div>
  )
}
