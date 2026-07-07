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

const SYSTEM_PROMPT = `You are the PrismML docs assistant. You answer questions about PrismML, the Bonsai models, and the tools that run them, using ONLY the documentation excerpts provided in the user message.

Rules:
- Answer from the excerpts. If they do not contain the answer, say "The docs do not cover that yet" and suggest the closest page.
- Keep answers under 120 words. Use plain sentences.
- Quote exact numbers from the excerpts. Never invent a number, a version, or a URL.
- Numbers labeled discovery or unconfirmed must be repeated with that label.`

function chunkCorpus(fullText: string): Doc[] {
  const docs: Doc[] = []
  for (const block of fullText.split('\n\n---\n\n')) {
    const url = block.match(/canonical_url:\s*(\S+)/)?.[1]
    const title = block.match(/^#\s+(.+)$/m)?.[1] ?? block.match(/title:\s*(.+)/)?.[1]
    if (!url || !title) continue
    const body = block.replace(/^---[\s\S]*?---\n/, '').trim()
    docs.push({ title: title.trim(), url, text: body })
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

// The inference trace: Jai's thesis from the PrismML interview — the visible
// inference surface is where users learn why 1-bit is different. Each stage
// names the design decision behind it and shows the number measured live.
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

function InferenceTrace({
  phase,
  trace,
  compact,
}: {
  phase: Phase
  trace: Trace
  compact?: boolean
}) {
  const order: Phase[] = ['retrieve', 'assemble', 'prefill', 'decode', 'done']
  const activeIdx = order.indexOf(phase)
  const value = (key: Phase): string => {
    if (key === 'retrieve')
      return trace.sources.length
        ? trace.sources.map((s) => s.title).join(', ')
        : 'no matching pages'
    if (key === 'assemble') return `${trace.contextChars.toLocaleString()} chars of excerpts`
    if (key === 'prefill')
      return trace.inputTokens
        ? `${trace.inputTokens.toLocaleString()} tokens${trace.ttftMs ? ` -> first token in ${(trace.ttftMs / 1000).toFixed(1)}s` : ''}`
        : 'waiting'
    if (key === 'decode')
      return trace.tokensPerSecond
        ? `${trace.tokensPerSecond.toFixed(0)} tok/s on your GPU`
        : 'streaming'
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
          <span className="font-semibold text-violet-700 dark:text-violet-400">
            Intelligence density: 2.832 per GB.
          </span>{' '}
          The whitepaper's benchmark of capability per gigabyte; 1-bit Bonsai
          1.7B leads every model it was compared against.{' '}
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

export function DocsChat() {
  const [phase, setPhase] = useState<'idle' | 'loading' | 'ready' | 'generating' | 'unsupported' | 'error'>('idle')
  const [progress, setProgress] = useState('')
  const [dtype, setDtype] = useState('')
  const [device, setDevice] = useState('')
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const searchParams = useSearchParams()
  const wormholeQ = searchParams.get('q')
  const autoAsked = useRef(false)
  const [errorText, setErrorText] = useState('')
  const workerRef = useRef<Worker | null>(null)
  const docsRef = useRef<Doc[]>([])
  const pendingTrace = useRef<Trace>({ sources: [], contextChars: 0 })
  const [livePhase, setLivePhase] = useState<Phase>('done')
  const [liveTrace, setLiveTrace] = useState<Trace | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    return () => workerRef.current?.terminate()
  }, [])

  // Wormhole: arriving from the search bar with ?q= means the reader already
  // asked. Start the model without a second click, then ask once it is ready.
  useEffect(() => {
    if (wormholeQ && phase === 'idle') start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wormholeQ])
  useEffect(() => {
    if (wormholeQ && phase === 'ready' && !autoAsked.current) {
      autoAsked.current = true
      ask(wormholeQ)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, wormholeQ])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  async function start() {
    if (!('gpu' in navigator)) {
      setPhase('unsupported')
      return
    }
    setPhase('loading')
    setProgress('Fetching the docs index…')
    try {
      const corpus = await fetch('/llms-full.txt').then((r) => r.text())
      docsRef.current = chunkCorpus(corpus)
    } catch {
      setErrorText('Could not fetch /llms-full.txt.')
      setPhase('error')
      return
    }
    const worker = new Worker('/chat-worker.mjs', { type: 'module' })
    workerRef.current = worker
    worker.onmessage = (e) => {
      const m = e.data
      if (m.type === 'progress') {
        const pct = Math.round((m.loaded / m.total) * 100)
        const mb = (m.total / 1024 / 1024).toFixed(0)
        setProgress(`Downloading ${m.file} — ${pct}% of ${mb} MB (one time; cached after)`)
      } else if (m.type === 'status') {
        setProgress(m.text)
      } else if (m.type === 'ready') {
        setDtype(m.dtype)
        setDevice(m.device ?? 'webgpu')
        setPhase('ready')
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
        setPhase('ready')
      } else if (m.type === 'error') {
        setErrorText(m.message)
        setPhase('error')
      }
    }
    setProgress('Starting the 1-bit Bonsai 1.7B download…')
    worker.postMessage({ type: 'load' })
  }

  function send() {
    const q = input.trim()
    if (!q) return
    ask(q)
  }

  function ask(q: string) {
    if (phase !== 'ready') return
    setInput('')
    const hits = retrieve(docsRef.current, q)
    const context = hits
      .map((h) => `### ${h.title} (${h.url})\n${h.text}`)
      .join('\n\n')
    pendingTrace.current = {
      sources: hits.map((h) => ({ title: h.title, url: h.url })),
      contextChars: context.length,
    }
    setLivePhase('assemble')
    setLiveTrace({ ...pendingTrace.current })
    // question first: small models answer dense excerpts better this way
    const userMsg = `Question: ${q}\n\nAnswer using only these documentation excerpts:\n\n${context || '(no matching pages found)'}`
    const history = messages.slice(-4).map((m) => ({ role: m.role, content: m.content }))
    setMessages((prev) => [...prev, { role: 'user', content: q }, { role: 'assistant', content: '' }])
    setPhase('generating')
    workerRef.current?.postMessage({
      type: 'generate',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history,
        { role: 'user', content: userMsg },
      ],
    })
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col px-4 py-8">
      <h1 className="font-display text-3xl tracking-tight text-slate-900 dark:text-white">
        Ask the docs
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        1-bit Bonsai 1.7B answers from these docs, running entirely in your
        browser over WebGPU. Nothing you type leaves your device.{' '}
        <Link href="/docs/build-and-run/docs-chat" className="font-medium text-violet-700 dark:text-violet-400">
          How it works
        </Link>
      </p>

      {phase === 'idle' && (
        <div className="mt-8 rounded-lg border border-slate-200 p-6 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            First use downloads the 290 MB 1-bit model once, then it is cached.
            You need a browser with WebGPU (recent Chrome, Edge, or Safari).
          </p>
          <button
            onClick={start}
            className="mt-4 rounded-full bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-500"
          >
            Load Bonsai in this tab
          </button>
        </div>
      )}

      {phase === 'unsupported' && (
        <div className="mt-8 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
          This browser does not expose WebGPU, which the chat needs to run the
          model locally. Recent Chrome, Edge, or Safari works. You can still
          read everything by hand, or point a coding agent at{' '}
          <Link href="/docs/start-here/use-with-ai" className="font-medium underline">
            the agent pathway
          </Link>
          .
        </div>
      )}

      {phase === 'loading' && (
        <div className="mt-8 rounded-lg border border-slate-200 p-6 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
          <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-violet-500" />
          {progress}
        </div>
      )}

      {phase === 'error' && (
        <div className="mt-8 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          The model could not start: {errorText}. A page refresh sometimes
          clears a stuck GPU context. If it keeps failing,{' '}
          <Link href="/docs/contribute/contributor-guide" className="font-medium underline">
            report it with your browser and GPU
          </Link>
          .
        </div>
      )}

      {(phase === 'ready' || phase === 'generating') && (
        <>
          <div
            ref={scrollRef}
            className="mt-6 flex-1 space-y-4 overflow-y-auto rounded-lg border border-slate-200 p-4 dark:border-slate-700"
            style={{ minHeight: 320, maxHeight: '55vh' }}
          >
            {device === 'wasm' && (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                WebGPU could not start on this device, so the model is running
                on a CPU fallback (WASM). It works, but answers will stream
                noticeably slower than on WebGPU.
              </div>
            )}
            {messages.length === 0 && (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                <p>
                  Model loaded ({dtype === 'q1' ? '1-bit' : dtype} build). These
                  are the gold test cases the agent is benchmarked on; try one:
                </p>
                <ul className="mt-2 list-disc pl-5">
                  <li>How big is the Bonsai 8B GGUF file?</li>
                  <li>What license are the Bonsai models under?</li>
                  <li>How much energy per token does Bonsai use on a Mac M4 Pro with MLX?</li>
                  <li>Does compressing weights shrink the KV cache?</li>
                </ul>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  {m.role === 'user' ? 'You' : 'Bonsai 1.7B'}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200">
                  {m.content || (phase === 'generating' && i === messages.length - 1 ? '…' : '')}
                </p>
                {m.trace && m.trace.sources.length > 0 && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Sources:{' '}
                    {m.trace.sources.map((s, j) => (
                      <span key={s.url}>
                        {j > 0 && ' · '}
                        <a href={s.url} className="font-medium text-violet-700 hover:underline dark:text-violet-400">
                          {s.title}
                        </a>
                      </span>
                    ))}
                  </p>
                )}
                {m.trace && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-xs font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
                      How this answer was made
                      {m.trace.tokensPerSecond
                        ? ` — ${m.trace.tokensPerSecond.toFixed(0)} tok/s`
                        : ''}
                    </summary>
                    <InferenceTrace phase="done" trace={m.trace} />
                  </details>
                )}
              </div>
            ))}
            {phase === 'generating' && liveTrace && (
              <InferenceTrace phase={livePhase} trace={liveTrace} />
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              send()
            }}
            className="mt-4 flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Bonsai, runtimes, or the whitepaper…"
              className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={phase === 'generating'}
              className="rounded-full bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
            >
              {phase === 'generating' ? 'Thinking…' : 'Ask'}
            </button>
          </form>
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
            A 1.7B model can misread things. Every answer links its source
            pages; check them before you quote a number.
          </p>
        </>
      )}
    </div>
  )
}
