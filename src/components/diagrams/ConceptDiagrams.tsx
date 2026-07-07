// One canonical concept visualization per technical guide. All share the
// same visual language: slate structure, violet for the concept's core
// object, cyan/emerald only when two series must be told apart.

function Fig({
  children,
  caption,
  label,
  minWidth = 560,
}: {
  children: React.ReactNode
  caption: string
  label: string
  minWidth?: number
}) {
  return (
    <figure className="my-8 overflow-x-auto">
      <div role="img" aria-label={label} className="mx-auto w-full max-w-2xl" style={{ minWidth }}>
        {children}
      </div>
      <figcaption className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
        {caption}
      </figcaption>
    </figure>
  )
}

const box = {
  cold: 'fill-slate-50 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-600',
  hot: 'fill-violet-50 stroke-violet-600 dark:fill-violet-500/15 dark:stroke-violet-400',
}
const ink = {
  strong: 'fill-slate-700 dark:fill-slate-200',
  hot: 'fill-violet-800 dark:fill-violet-200',
  muted: 'fill-slate-500 dark:fill-slate-400',
}
const arrowDef = (
  <marker id="cd-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5.5" markerHeight="5.5" orient="auto">
    <path d="M0 0L8 4L0 8z" className="fill-slate-400 dark:fill-slate-500" />
  </marker>
)

function PrefillDecode() {
  const decode = [0, 1, 2, 3]
  return (
    <Fig
      label="Prefill processes the whole prompt in one parallel pass, then decode generates one token at a time, each step reading the KV cache."
      caption="Prefill is one wide parallel pass over the prompt (measured here at 140 tokens per second). Decode is a serial loop, one token per step, each reading the KV cache (measured at 65 tokens per second)."
    >
      <svg viewBox="0 0 560 190" className="w-full font-sans">
        <defs>{arrowDef}</defs>
        <text x={20} y={24} fontSize={12} fontWeight={600} className={ink.strong}>
          Prefill: whole prompt at once
        </text>
        <rect x={20} y={34} width={170} height={44} rx={6} strokeWidth={2} className={box.hot} />
        <text x={105} y={53} textAnchor="middle" fontSize={11} className={ink.hot}>
          512 prompt tokens
        </text>
        <text x={105} y={68} textAnchor="middle" fontSize={9.5} className={ink.muted}>
          parallel · compute-heavy · 140 t/s
        </text>
        <line x1={196} y1={56} x2={238} y2={56} strokeWidth={1.5} markerEnd="url(#cd-arrow)" className="stroke-slate-400 dark:stroke-slate-500" />
        <text x={20} y={112} fontSize={12} fontWeight={600} className={ink.strong}>
          Decode: one token per step
        </text>
        {decode.map((i) => (
          <g key={i}>
            <rect x={244 + i * 76} y={34} width={56} height={44} rx={6} strokeWidth={1} className={box.cold} />
            <text x={272 + i * 76} y={60} textAnchor="middle" fontSize={11} className={ink.strong}>
              tok {i + 1}
            </text>
            {i < decode.length - 1 && (
              <line x1={302 + i * 76} y1={56} x2={314 + i * 76} y2={56} strokeWidth={1.5} markerEnd="url(#cd-arrow)" className="stroke-slate-400 dark:stroke-slate-500" />
            )}
          </g>
        ))}
        <rect x={244} y={122} width={284} height={36} rx={6} strokeWidth={2} className={box.hot} />
        <text x={386} y={144} textAnchor="middle" fontSize={11} className={ink.hot}>
          KV cache: keys and values of every past token
        </text>
        {decode.map((i) => (
          <line
            key={i}
            x1={272 + i * 76}
            y1={120}
            x2={272 + i * 76}
            y2={82}
            strokeWidth={1.2}
            strokeDasharray="3 3"
            markerEnd="url(#cd-arrow)"
            className="stroke-violet-500/70 dark:stroke-violet-400/70"
          />
        ))}
        <text x={386} y={178} textAnchor="middle" fontSize={9.5} className={ink.muted}>
          every decode step reads the cache · serial · memory-heavy · 65 t/s
        </text>
      </svg>
    </Fig>
  )
}

function WeightsOnDisk() {
  const bits = Array.from({ length: 32 })
  return (
    <Fig
      label="FP16 stores sixteen bits per weight. The 1-bit format stores one sign bit per weight plus one shared scale per group of 128, for 1.125 bits per weight, shrinking 16.38 gigabytes to 1.15."
      caption="One FP16 weight costs 16 bits. The Q1_0_g128 format costs one sign bit per weight plus one FP16 scale shared by 128 weights: 1 + 16/128 = 1.125 bits per weight. That is how 16.38 GB becomes 1.15 GB."
    >
      <svg viewBox="0 0 560 210" className="w-full font-sans">
        <text x={20} y={22} fontSize={12} fontWeight={600} className={ink.strong}>
          FP16: 16 bits per weight
        </text>
        {[0, 1].map((w) => (
          <g key={w}>
            {Array.from({ length: 16 }).map((_, b) => (
              <rect
                key={b}
                x={20 + w * 140 + b * 8}
                y={32}
                width={7}
                height={16}
                className="fill-slate-300 dark:fill-slate-600"
              />
            ))}
            <text x={20 + w * 140 + 64} y={62} textAnchor="middle" fontSize={9.5} className={ink.muted}>
              weight {w + 1}
            </text>
          </g>
        ))}
        <text x={20} y={98} fontSize={12} fontWeight={600} className={ink.strong}>
          1-bit (Q1_0_g128): 1 sign bit per weight + 1 scale per 128
        </text>
        {bits.map((_, b) => (
          <rect
            key={b}
            x={20 + b * 11}
            y={108}
            width={9}
            height={16}
            className="fill-violet-600 dark:fill-violet-500"
          />
        ))}
        <text x={214} y={121} fontSize={10} className={ink.muted}>
          … ×128 sign bits
        </text>
        <rect x={296} y={104} width={56} height={24} rx={4} strokeWidth={2} className={box.hot} />
        <text x={324} y={120} textAnchor="middle" fontSize={10} className={ink.hot}>
          scale
        </text>
        <text x={362} y={121} fontSize={10.5} className={ink.strong}>
          = 1 + 16/128 = 1.125 bits/weight
        </text>
        <g style={{ fontVariantNumeric: 'tabular-nums' }}>
          <rect x={20} y={152} width={480} height={16} rx={4} className="fill-slate-300 dark:fill-slate-600" />
          <text x={506} y={165} fontSize={10} className={ink.muted}>
            16.38 GB
          </text>
          <rect x={20} y={176} width={34} height={16} rx={4} className="fill-violet-600 dark:fill-violet-500" />
          <text x={60} y={189} fontSize={10} className={ink.strong}>
            1.15 GB — the same 8.19B parameters
          </text>
        </g>
      </svg>
    </Fig>
  )
}

function KernelReading() {
  const tiers = [
    { label: 'Registers', sub: 'kilobytes · fastest', w: 130 },
    { label: 'On-chip SRAM / cache', sub: 'megabytes · fast', w: 260 },
    { label: 'DRAM / unified memory', sub: 'gigabytes · the slow trip', w: 420 },
  ]
  return (
    <Fig
      label="The memory hierarchy: small fast registers on top, on-chip SRAM in the middle, large slow DRAM at the bottom. A kernel's job is to minimize trips to the bottom."
      caption="Every kernel fights the same shape: compute sits at the top, data sits at the bottom. A fast kernel loads a tile of weights once, does as much math as possible in registers and SRAM, and only then goes back down. When you read kernel code, look for that tiling."
    >
      <svg viewBox="0 0 560 190" className="w-full font-sans">
        <defs>{arrowDef}</defs>
        {tiers.map((t, i) => (
          <g key={t.label}>
            <rect
              x={(560 - t.w) / 2}
              y={18 + i * 52}
              width={t.w}
              height={40}
              rx={6}
              strokeWidth={i === 0 ? 2 : 1}
              className={i === 0 ? box.hot : box.cold}
            />
            <text x={280} y={35 + i * 52} textAnchor="middle" fontSize={11.5} fontWeight={i === 0 ? 600 : 500} className={i === 0 ? ink.hot : ink.strong}>
              {t.label}
            </text>
            <text x={280} y={50 + i * 52} textAnchor="middle" fontSize={9.5} className={ink.muted}>
              {t.sub}
            </text>
          </g>
        ))}
        <line x1={80} y1={148} x2={80} y2={44} strokeWidth={1.5} markerEnd="url(#cd-arrow)" className="stroke-slate-400 dark:stroke-slate-500" />
        <text x={72} y={100} fontSize={9.5} textAnchor="end" className={ink.muted}>
          load a tile once
        </text>
        <line x1={480} y1={44} x2={480} y2={148} strokeWidth={1.5} strokeDasharray="4 3" markerEnd="url(#cd-arrow)" className="stroke-slate-400 dark:stroke-slate-500" />
        <text x={488} y={100} fontSize={9.5} className={ink.muted}>
          every extra trip costs
        </text>
      </svg>
    </Fig>
  )
}

function BandwidthLedger() {
  // ceiling = bandwidth / bytes-streamed-per-token; M4 Pro spec 273 GB/s
  const bars = [
    { label: 'FP16 ceiling', sub: '273 GB/s ÷ 16.38 GB', v: 17, hot: false },
    { label: '1-bit ceiling', sub: '273 GB/s ÷ 1.16 GB', v: 235, hot: true },
    { label: 'Measured decode', sub: 'llama.cpp on M4 Pro', v: 65, hot: true },
  ]
  const max = 250
  const W = 560
  const barW = 120
  return (
    <Fig
      label="Bar chart of token-per-second ceilings implied by memory bandwidth: about 17 for FP16, about 235 for 1-bit, and 65 measured."
      caption="Decode streams the whole weight file per token, so bandwidth divided by file size sets a hard ceiling. On an M4 Pro (273 GB/s, Apple's spec), FP16 weights cap near 17 tokens per second before any compute happens; 1-bit weights raise that ceiling to roughly 235. Our measured 65 t/s sits well under its ceiling, which tells you kernels and cache traffic, not weight streaming, now set the pace."
    >
      <svg viewBox={`0 0 ${W} 230`} className="w-full font-sans">
        {[50, 100, 150, 200, 250].map((v) => (
          <g key={v}>
            <line x1={60} y1={180 - (v / max) * 150} x2={W - 20} y2={180 - (v / max) * 150} strokeWidth={1} className="stroke-slate-200 dark:stroke-slate-700" />
            <text x={54} y={184 - (v / max) * 150} textAnchor="end" fontSize={9.5} className={ink.muted} style={{ fontVariantNumeric: 'tabular-nums' }}>
              {v}
            </text>
          </g>
        ))}
        <line x1={60} y1={180} x2={W - 20} y2={180} strokeWidth={1} className="stroke-slate-400 dark:stroke-slate-500" />
        {bars.map((b, i) => {
          const h = (b.v / max) * 150
          const x = 90 + i * (barW + 40)
          return (
            <g key={b.label}>
              <path
                d={`M ${x} 180 L ${x} ${184 - h} Q ${x} ${180 - h} ${x + 4} ${180 - h} L ${x + barW - 4} ${180 - h} Q ${x + barW} ${180 - h} ${x + barW} ${184 - h} L ${x + barW} 180 Z`}
                className={b.hot ? 'fill-violet-600 dark:fill-violet-500' : 'fill-slate-400 dark:fill-slate-500'}
              />
              <text x={x + barW / 2} y={172 - h} textAnchor="middle" fontSize={11} fontWeight={600} className={ink.strong} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {b.v} t/s
              </text>
              <text x={x + barW / 2} y={198} textAnchor="middle" fontSize={10.5} className={ink.strong}>
                {b.label}
              </text>
              <text x={x + barW / 2} y={212} textAnchor="middle" fontSize={9} className={ink.muted}>
                {b.sub}
              </text>
            </g>
          )
        })}
        <text x={20} y={20} fontSize={10.5} className={ink.muted}>
          tokens per second
        </text>
      </svg>
    </Fig>
  )
}

function Architectures() {
  // memory vs context: attention linear, SSM flat
  const W = 560
  const pts = [0, 1, 2, 3, 4, 5, 6, 7, 8]
  return (
    <Fig
      label="Line chart: attention's per-sequence memory grows linearly with context length while a state space model's state stays constant."
      caption="The core architectural tradeoff for long context. Attention keeps keys and values for every past token, so its memory grows with the sequence (this is the KV cache). A state space model carries one fixed-size state forward, so its memory stays flat, at the cost of a lossier summary of the past. Hybrids mix both."
    >
      <svg viewBox={`0 0 ${W} 210`} className="w-full font-sans">
        <line x1={60} y1={170} x2={W - 30} y2={170} strokeWidth={1} className="stroke-slate-400 dark:stroke-slate-500" />
        <line x1={60} y1={170} x2={60} y2={24} strokeWidth={1} className="stroke-slate-400 dark:stroke-slate-500" />
        <text x={W / 2} y={196} textAnchor="middle" fontSize={10.5} className={ink.muted}>
          context length
        </text>
        <text x={26} y={100} textAnchor="middle" fontSize={10.5} transform="rotate(-90 26 100)" className={ink.muted}>
          memory per sequence
        </text>
        <polyline
          points={pts.map((i) => `${60 + i * 56},${166 - i * 15}`).join(' ')}
          fill="none"
          strokeWidth={2.5}
          className="stroke-cyan-600"
        />
        <text x={60 + 7 * 56} y={166 - 7 * 15 - 10} fontSize={10.5} fontWeight={600} textAnchor="middle" className={ink.strong}>
          attention (KV cache)
        </text>
        <polyline
          points={pts.map((i) => `${60 + i * 56},142`).join(' ')}
          fill="none"
          strokeWidth={2.5}
          className="stroke-emerald-600"
        />
        <text x={60 + 7 * 56} y={134} fontSize={10.5} fontWeight={600} textAnchor="middle" className={ink.strong}>
          SSM fixed state
        </text>
      </svg>
    </Fig>
  )
}

function FeatureStores() {
  return (
    <Fig
      label="The training path reads features from the offline store and the serving path reads the same definitions from the online store. If the two drift, training-serving skew appears."
      caption="One feature definition, two consumers. Training reads history from the offline store; the live agent reads the freshest values from the online store. The whole point of a feature store is the vertical line: both paths compute features the same way, so the model sees the same world in training and in serving."
    >
      <svg viewBox="0 0 560 200" className="w-full font-sans">
        <defs>{arrowDef}</defs>
        <rect x={20} y={70} width={140} height={56} rx={6} strokeWidth={2} className={box.hot} />
        <text x={90} y={94} textAnchor="middle" fontSize={11.5} fontWeight={600} className={ink.hot}>
          Feature definitions
        </text>
        <text x={90} y={110} textAnchor="middle" fontSize={9.5} className={ink.muted}>
          one source of truth
        </text>
        <rect x={230} y={20} width={150} height={48} rx={6} strokeWidth={1} className={box.cold} />
        <text x={305} y={40} textAnchor="middle" fontSize={11} className={ink.strong}>
          Offline store
        </text>
        <text x={305} y={56} textAnchor="middle" fontSize={9.5} className={ink.muted}>
          history for training
        </text>
        <rect x={230} y={128} width={150} height={48} rx={6} strokeWidth={1} className={box.cold} />
        <text x={305} y={148} textAnchor="middle" fontSize={11} className={ink.strong}>
          Online store
        </text>
        <text x={305} y={164} textAnchor="middle" fontSize={9.5} className={ink.muted}>
          fresh values for serving
        </text>
        <rect x={440} y={20} width={100} height={48} rx={6} strokeWidth={1} className={box.cold} />
        <text x={490} y={48} textAnchor="middle" fontSize={11} className={ink.strong}>
          Training
        </text>
        <rect x={440} y={128} width={100} height={48} rx={6} strokeWidth={1} className={box.cold} />
        <text x={490} y={148} textAnchor="middle" fontSize={11} className={ink.strong}>
          Live agent
        </text>
        <text x={490} y={164} textAnchor="middle" fontSize={9.5} className={ink.muted}>
          e.g. local Bonsai
        </text>
        <line x1={166} y1={84} x2={224} y2={52} strokeWidth={1.5} markerEnd="url(#cd-arrow)" className="stroke-slate-400 dark:stroke-slate-500" />
        <line x1={166} y1={112} x2={224} y2={144} strokeWidth={1.5} markerEnd="url(#cd-arrow)" className="stroke-slate-400 dark:stroke-slate-500" />
        <line x1={386} y1={44} x2={434} y2={44} strokeWidth={1.5} markerEnd="url(#cd-arrow)" className="stroke-slate-400 dark:stroke-slate-500" />
        <line x1={386} y1={152} x2={434} y2={152} strokeWidth={1.5} markerEnd="url(#cd-arrow)" className="stroke-slate-400 dark:stroke-slate-500" />
        <line x1={305} y1={74} x2={305} y2={122} strokeWidth={2} strokeDasharray="5 4" className="stroke-violet-600 dark:stroke-violet-400" />
        <text x={316} y={101} fontSize={9.5} className={ink.muted}>
          same definitions, or skew
        </text>
      </svg>
    </Fig>
  )
}

function TrainingAlignment() {
  const steps = [
    { label: 'Base model', sub: 'pretrained' },
    { label: 'SFT', sub: 'imitate examples' },
    { label: 'DPO / GRPO', sub: 'prefer chosen over rejected' },
    { label: 'Regression eval', sub: 'did anything break?' },
    { label: 'Ship', sub: 'adapter or merge' },
  ]
  return (
    <Fig
      label="The adaptation pipeline: base model, supervised fine-tuning on examples, preference tuning on chosen versus rejected pairs, a regression evaluation gate, then ship."
      caption="Every fine-tune walks this line. SFT teaches the model what good answers look like; preference tuning (DPO or GRPO) teaches it which of two answers is better; the regression gate is the step teams skip and regret, because alignment can quietly trade away skills you did not test."
    >
      <svg viewBox="0 0 560 120" className="w-full font-sans">
        <defs>{arrowDef}</defs>
        {steps.map((s, i) => {
          const w = 96
          const x = 16 + i * (w + 14)
          const hot = i === 1 || i === 2
          return (
            <g key={s.label}>
              {i > 0 && (
                <line x1={x - 14} y1={54} x2={x - 3} y2={54} strokeWidth={1.5} markerEnd="url(#cd-arrow)" className="stroke-slate-400 dark:stroke-slate-500" />
              )}
              <rect x={x} y={30} width={w} height={48} rx={6} strokeWidth={hot ? 2 : 1} className={hot ? box.hot : box.cold} />
              <text x={x + w / 2} y={50} textAnchor="middle" fontSize={10.5} fontWeight={hot ? 600 : 500} className={hot ? ink.hot : ink.strong}>
                {s.label}
              </text>
              <text x={x + w / 2} y={66} textAnchor="middle" fontSize={8.5} className={ink.muted}>
                {s.sub}
              </text>
            </g>
          )
        })}
        <path d="M 400 82 C 380 106, 220 106, 178 82" fill="none" strokeWidth={1.5} strokeDasharray="5 4" markerEnd="url(#cd-arrow)" className="stroke-slate-400 dark:stroke-slate-500" />
        <text x={290} y={112} textAnchor="middle" fontSize={9.5} className={ink.muted}>
          fails the gate: back to data and SFT
        </text>
      </svg>
    </Fig>
  )
}

function EvaluationConcepts() {
  const steps = [
    { label: 'Task cards', sub: 'what good looks like' },
    { label: 'Run on the target', sub: 'the device users own' },
    { label: 'Score', sub: 'quality + latency + memory + energy' },
    { label: 'Regression gate', sub: 'compare to last run' },
  ]
  return (
    <Fig
      label="The evaluation loop: define task cards, run on the target device, score quality and efficiency together, gate on regressions, and feed results back into the tasks."
      caption="Evaluation for local models is a loop, not a leaderboard. The scoring box is the part most teams get wrong: for a model like Bonsai the deployment target makes latency, memory, and energy part of quality, not a separate report."
    >
      <svg viewBox="0 0 560 130" className="w-full font-sans">
        <defs>{arrowDef}</defs>
        {steps.map((s, i) => {
          const w = 122
          const x = 16 + i * (w + 14)
          const hot = i === 2
          return (
            <g key={s.label}>
              {i > 0 && (
                <line x1={x - 14} y1={54} x2={x - 3} y2={54} strokeWidth={1.5} markerEnd="url(#cd-arrow)" className="stroke-slate-400 dark:stroke-slate-500" />
              )}
              <rect x={x} y={30} width={w} height={48} rx={6} strokeWidth={hot ? 2 : 1} className={hot ? box.hot : box.cold} />
              <text x={x + w / 2} y={50} textAnchor="middle" fontSize={10.5} fontWeight={hot ? 600 : 500} className={hot ? ink.hot : ink.strong}>
                {s.label}
              </text>
              <text x={x + w / 2} y={66} textAnchor="middle" fontSize={8.5} className={ink.muted}>
                {s.sub}
              </text>
            </g>
          )
        })}
        <path d="M 480 82 C 440 118, 120 118, 76 82" fill="none" strokeWidth={1.5} strokeDasharray="5 4" markerEnd="url(#cd-arrow)" className="stroke-slate-400 dark:stroke-slate-500" />
        <text x={280} y={124} textAnchor="middle" fontSize={9.5} className={ink.muted}>
          results refine the task cards
        </text>
      </svg>
    </Fig>
  )
}

const DIAGRAMS: Record<string, () => React.ReactNode> = {
  'prefill-decode': PrefillDecode,
  'weights-on-disk': WeightsOnDisk,
  'kernel-reading': KernelReading,
  'bandwidth-ledger': BandwidthLedger,
  architectures: Architectures,
  'feature-stores': FeatureStores,
  'training-alignment': TrainingAlignment,
  'evaluation-concepts': EvaluationConcepts,
}

export function ConceptDiagram({ name }: { name: string }) {
  const D = DIAGRAMS[name]
  return D ? <D /> : null
}
