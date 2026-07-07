// The one canonical system-level picture of PrismML, shared by every
// technical guide. `highlight` marks the territory the current guide owns.

const NODES: { key: string; label: string; sub?: string }[] = [
  { key: 'data', label: 'Data' },
  { key: 'architecture', label: 'Architecture' },
  { key: 'training', label: 'Training' },
  { key: 'weights', label: 'Weights on disk', sub: '1.15 GB GGUF' },
  { key: 'runtime', label: 'Runtime', sub: 'prefill, KV cache, decode' },
  { key: 'kernels', label: 'Kernels', sub: 'Metal / CUDA' },
  { key: 'output', label: 'Tokens out', sub: 'tok/s and energy' },
  { key: 'evaluation', label: 'Evaluation' },
]

// bandwidth highlights the weights->runtime->kernels traffic instead of one node
const EDGE_HIGHLIGHTS: Record<string, [number, number][]> = {
  bandwidth: [
    [3, 4],
    [4, 5],
  ],
}

const NODE_HIGHLIGHTS: Record<string, string[]> = {
  data: ['data'],
  architecture: ['architecture'],
  training: ['training'],
  weights: ['weights'],
  runtime: ['runtime'],
  kv: ['runtime'],
  'prefill-decode': ['runtime'],
  kernels: ['kernels'],
  bandwidth: ['weights', 'kernels'],
  output: ['output'],
  evaluation: ['evaluation'],
}

const COL_W = 118
const BOX_H = 46
const TOP = 26
const GAP = 14

export function SystemModel({ highlight = '' }: { highlight?: string }) {
  const hot = new Set(NODE_HIGHLIGHTS[highlight] ?? [])
  const hotEdges = EDGE_HIGHLIGHTS[highlight] ?? []
  const W = NODES.length * COL_W + GAP
  const H = TOP + BOX_H + 58
  const x = (i: number) => GAP + i * COL_W
  const isHotEdge = (i: number) => hotEdges.some(([a, b]) => a === i - 1 && b === i)

  return (
    <figure className="my-8 overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="The PrismML system at every layer: data, architecture, training, weights on disk, runtime, kernels, tokens out, and evaluation feeding back to data."
        className="mx-auto w-full max-w-3xl font-sans"
        style={{ minWidth: 640 }}
      >
        <defs>
          <marker id="sm-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5.5" markerHeight="5.5" orient="auto">
            <path d="M0 0L8 4L0 8z" className="fill-slate-400 dark:fill-slate-500" />
          </marker>
          <marker id="sm-arrow-hot" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5.5" markerHeight="5.5" orient="auto">
            <path d="M0 0L8 4L0 8z" className="fill-violet-600 dark:fill-violet-400" />
          </marker>
        </defs>

        {NODES.map((n, i) => {
          const isHot = hot.has(n.key)
          return (
            <g key={n.key}>
              {i > 0 && (
                <line
                  x1={x(i - 1) + COL_W - GAP - 4}
                  y1={TOP + BOX_H / 2}
                  x2={x(i) - 4}
                  y2={TOP + BOX_H / 2}
                  strokeWidth={isHotEdge(i) ? 2.5 : 1.5}
                  markerEnd={isHotEdge(i) ? 'url(#sm-arrow-hot)' : 'url(#sm-arrow)'}
                  className={
                    isHotEdge(i)
                      ? 'stroke-violet-600 dark:stroke-violet-400'
                      : 'stroke-slate-400 dark:stroke-slate-500'
                  }
                />
              )}
              <rect
                x={x(i)}
                y={TOP}
                width={COL_W - GAP - 8}
                height={BOX_H}
                rx={6}
                strokeWidth={isHot ? 2 : 1}
                className={
                  isHot
                    ? 'fill-violet-50 stroke-violet-600 dark:fill-violet-500/15 dark:stroke-violet-400'
                    : 'fill-slate-50 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600'
                }
              />
              <text
                x={x(i) + (COL_W - GAP - 8) / 2}
                y={TOP + (n.sub ? 20 : BOX_H / 2 + 4)}
                textAnchor="middle"
                fontSize={11.5}
                fontWeight={isHot ? 600 : 500}
                className={
                  isHot
                    ? 'fill-violet-800 dark:fill-violet-200'
                    : 'fill-slate-700 dark:fill-slate-200'
                }
              >
                {n.label}
              </text>
              {n.sub && (
                <text
                  x={x(i) + (COL_W - GAP - 8) / 2}
                  y={TOP + 34}
                  textAnchor="middle"
                  fontSize={8.5}
                  className={
                    isHot
                      ? 'fill-violet-700 dark:fill-violet-300'
                      : 'fill-slate-500 dark:fill-slate-400'
                  }
                >
                  {n.sub}
                </text>
              )}
            </g>
          )
        })}

        {/* evaluation feeds back to data and training */}
        <path
          d={`M ${x(7) + (COL_W - GAP - 8) / 2} ${TOP + BOX_H + 4} C ${x(6)} ${TOP + BOX_H + 44}, ${x(2)} ${TOP + BOX_H + 44}, ${x(1) + 20} ${TOP + BOX_H + 4}`}
          fill="none"
          strokeWidth={1.5}
          strokeDasharray="5 4"
          markerEnd="url(#sm-arrow)"
          className="stroke-slate-400 dark:stroke-slate-500"
        />
        <text
          x={x(4)}
          y={TOP + BOX_H + 44}
          textAnchor="middle"
          fontSize={10}
          className="fill-slate-500 dark:fill-slate-400"
        >
          evaluation feeds the next round of data and training
        </text>
      </svg>
      <figcaption className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
        The PrismML system at every layer. The highlighted stage is the part
        this guide explains.
      </figcaption>
    </figure>
  )
}
