const BYTES_PER_TOKEN = 2 * 36 * 8 * 128 * 2 // K and V x layers x kv_heads x head_dim x fp16 bytes

const POINTS = [4096, 8192, 16384, 32768, 65536].map((tokens) => ({
  tokens,
  gb: (tokens * BYTES_PER_TOKEN) / 1024 ** 3,
}))

const W = 460
const H = 240
const PAD_L = 46
const PAD_B = 34
const PAD_T = 26
const PLOT_W = W - PAD_L - 16
const PLOT_H = H - PAD_T - PAD_B
const MAX_GB = 10

export function KVCacheDiagram() {
  const barW = 44
  const step = PLOT_W / POINTS.length
  const x = (i: number) => PAD_L + i * step + (step - barW) / 2
  const y = (gb: number) => PAD_T + PLOT_H * (1 - gb / MAX_GB)

  return (
    <figure className="my-8 overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="KV cache memory grows linearly with context length, from about 0.6 GB at 4k tokens to about 9.2 GB at 64k tokens for a Qwen3-8B-class model."
        className="mx-auto w-full max-w-xl font-sans"
      >
        {/* recessive grid */}
        {[2.5, 5, 7.5, 10].map((gb) => (
          <g key={gb}>
            <line
              x1={PAD_L}
              y1={y(gb)}
              x2={W - 16}
              y2={y(gb)}
              strokeWidth={1}
              className="stroke-slate-200 dark:stroke-slate-700"
            />
            <text
              x={PAD_L - 6}
              y={y(gb) + 3.5}
              textAnchor="end"
              fontSize={10.5}
              className="fill-slate-500 dark:fill-slate-400"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {gb} GB
            </text>
          </g>
        ))}

        {/* baseline */}
        <line
          x1={PAD_L}
          y1={y(0)}
          x2={W - 16}
          y2={y(0)}
          strokeWidth={1}
          className="stroke-slate-400 dark:stroke-slate-500"
        />

        {/* bars: single series, baseline-anchored, rounded data end */}
        {POINTS.map((p, i) => {
          const top = y(p.gb)
          const h = y(0) - top
          return (
            <g key={p.tokens}>
              <path
                d={`M ${x(i)} ${y(0)} L ${x(i)} ${top + 4} Q ${x(i)} ${top} ${x(i) + 4} ${top} L ${x(i) + barW - 4} ${top} Q ${x(i) + barW} ${top} ${x(i) + barW} ${top + 4} L ${x(i) + barW} ${y(0)} Z`}
                className="fill-violet-600 dark:fill-violet-500"
              >
                <title>{`${(p.tokens / 1024).toFixed(0)}k tokens: ${p.gb.toFixed(2)} GB of KV cache`}</title>
              </path>
              <text
                x={x(i) + barW / 2}
                y={top - 6}
                textAnchor="middle"
                fontSize={11}
                className="fill-slate-700 dark:fill-slate-200"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {p.gb >= 1 ? p.gb.toFixed(1) : p.gb.toFixed(2)}
              </text>
              <text
                x={x(i) + barW / 2}
                y={y(0) + 16}
                textAnchor="middle"
                fontSize={10.5}
                className="fill-slate-500 dark:fill-slate-400"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {p.tokens / 1024}k
              </text>
            </g>
          )
        })}
        <text
          x={PAD_L + PLOT_W / 2}
          y={H - 4}
          textAnchor="middle"
          fontSize={10.5}
          className="fill-slate-500 dark:fill-slate-400"
        >
          context length in tokens
        </text>
      </svg>
      <figcaption className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
        Illustrative KV cache growth at 144 KB per token, computed from the
        Qwen3-8B-class constants on this page (36 layers, 8 KV heads, head
        dimension 128, fp16). Not a measured run.
      </figcaption>
    </figure>
  )
}
