// Data: Table 5 and Table 6 of the 1-bit Bonsai 8B whitepaper (PrismML, 2026-03-31).
const MODELS = [
  { name: 'Bonsai 1.7B', gb: 0.24, score: 49.6, bonsai: true },
  { name: 'Bonsai 4B', gb: 0.57, score: 62.72, bonsai: true },
  { name: 'Bonsai 8B', gb: 1.15, score: 70.5, bonsai: true },
  { name: 'Qwen 3 0.6B', gb: 1.19, score: 48.02 },
  { name: 'Gemma 3 1B', gb: 2.0, score: 45.53 },
  { name: 'LFM2 1.2B', gb: 2.34, score: 46.73 },
  { name: 'Llama 3.2 1B', gb: 2.47, score: 39.88 },
  { name: 'Qwen 3 1.7B', gb: 3.44, score: 66.57 },
  { name: 'Llama 3.2 3B', gb: 6.43, score: 64.35 },
  { name: 'Ministral3 3B', gb: 6.86, score: 73.22 },
  { name: 'Gemma 3 4B', gb: 7.76, score: 67.88 },
  { name: 'Qwen 3 4B', gb: 8.04, score: 77.1 },
  { name: 'Trinity Nano 6B', gb: 12.24, score: 61.17 },
  { name: 'Olmo 3 7B', gb: 14.6, score: 70.9 },
  { name: 'DeepSeek R1 Qwen 7B', gb: 15.23, score: 55.03 },
  { name: 'Ministral3 8B', gb: 16.04, score: 71.0 },
  { name: 'Llama 3.1 8B', gb: 16.06, score: 67.08 },
  { name: 'Hermes 3 8B', gb: 16.06, score: 65.43 },
  { name: 'Marin 8B', gb: 16.06, score: 56.55 },
  { name: 'Qwen 3 8B', gb: 16.38, score: 79.3, label: true },
  { name: 'RNJ 8B', gb: 16.62, score: 73.12 },
  { name: 'LFM2 8B', gb: 16.68, score: 69.58 },
  { name: 'GLM 4 9B', gb: 18.8, score: 65.73 },
]

const W = 620
const H = 340
const PAD = { l: 46, r: 16, t: 16, b: 44 }
const GB_MIN = Math.log10(0.2)
const GB_MAX = Math.log10(20)
const S_MIN = 35
const S_MAX = 85

const x = (gb: number) =>
  PAD.l + ((Math.log10(gb) - GB_MIN) / (GB_MAX - GB_MIN)) * (W - PAD.l - PAD.r)
const y = (s: number) =>
  PAD.t + (1 - (s - S_MIN) / (S_MAX - S_MIN)) * (H - PAD.t - PAD.b)

export function FrontierDiagram() {
  return (
    <figure className="my-8 overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Scatter plot of average benchmark score against model size on a log scale. The three Bonsai models score as well as models ten times their size."
        className="mx-auto w-full max-w-2xl font-sans"
      >
        {[40, 50, 60, 70, 80].map((s) => (
          <g key={s}>
            <line
              x1={PAD.l}
              y1={y(s)}
              x2={W - PAD.r}
              y2={y(s)}
              strokeWidth={1}
              className="stroke-slate-200 dark:stroke-slate-700"
            />
            <text
              x={PAD.l - 6}
              y={y(s) + 3.5}
              textAnchor="end"
              fontSize={10.5}
              className="fill-slate-500 dark:fill-slate-400"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {s}
            </text>
          </g>
        ))}
        {[0.25, 0.5, 1, 2, 4, 8, 16].map((gb) => (
          <text
            key={gb}
            x={x(gb)}
            y={H - PAD.b + 18}
            textAnchor="middle"
            fontSize={10.5}
            className="fill-slate-500 dark:fill-slate-400"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {gb}
          </text>
        ))}
        <text
          x={PAD.l + (W - PAD.l - PAD.r) / 2}
          y={H - 6}
          textAnchor="middle"
          fontSize={10.5}
          className="fill-slate-500 dark:fill-slate-400"
        >
          model size on disk in GB (log scale)
        </text>
        <text
          x={14}
          y={PAD.t + (H - PAD.t - PAD.b) / 2}
          textAnchor="middle"
          fontSize={10.5}
          transform={`rotate(-90 14 ${PAD.t + (H - PAD.t - PAD.b) / 2})`}
          className="fill-slate-500 dark:fill-slate-400"
        >
          average benchmark score
        </text>

        {MODELS.map((m) => (
          <g key={m.name}>
            <circle
              cx={x(m.gb)}
              cy={y(m.score)}
              r={m.bonsai ? 6 : 4.5}
              className={
                m.bonsai
                  ? 'fill-violet-600 dark:fill-violet-500'
                  : 'fill-slate-400/70 dark:fill-slate-500/70'
              }
            >
              <title>{`${m.name}: ${m.score} average score at ${m.gb} GB`}</title>
            </circle>
            {(m.bonsai || m.label) && (
              <text
                x={x(m.gb)}
                y={y(m.score) - 10}
                textAnchor="middle"
                fontSize={10.5}
                fontWeight={600}
                className="fill-slate-700 dark:fill-slate-200"
              >
                {m.name}
              </text>
            )}
          </g>
        ))}
      </svg>
      <figcaption className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
        Average score across the six whitepaper benchmarks against model size on
        disk. Violet points are the 1-bit Bonsai family. Data from Tables 5 and
        6 of the whitepaper.
      </figcaption>
    </figure>
  )
}
