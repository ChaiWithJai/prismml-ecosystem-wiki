'use client'

import { useState } from 'react'
import Link from 'next/link'

const STAGES = [
  {
    name: 'Problems and users',
    question: 'What work should the model do, and how do we judge success?',
    players: 'Domain owners, benchmark authors, Arena-style evaluators',
    href: '/docs/technical-guides/evaluation-concepts',
    linkLabel: 'Evaluation concepts',
  },
  {
    name: 'Data and features',
    question: 'What raw data, features, prompts, and labels feed the system?',
    players: 'Feature stores, data pipelines, vector stores, Ray Data',
    href: '/docs/technical-guides/feature-stores',
    linkLabel: 'Feature stores guide',
  },
  {
    name: 'Model architecture',
    question: 'Which backbone fits the workload?',
    players: 'Transformers, state space models, hybrids, Liquid LFMs, Bonsai',
    href: '/docs/technical-guides/architectures',
    linkLabel: 'Architectures guide',
  },
  {
    name: 'Training and post-training',
    question: 'How is the model adapted or aligned?',
    players: 'Unsloth, TRL, OpenRLHF, Axolotl, LLaMA-Factory',
    href: '/docs/technical-guides/training-and-alignment',
    linkLabel: 'Training and alignment guide',
  },
  {
    name: 'Compression and formats',
    question: 'How does the model fit into memory and onto devices?',
    players: 'GGUF, MLX, AWQ/GPTQ, FP8, PrismML 1-bit and ternary',
    href: '/docs/technical-guides/weights-on-disk',
    linkLabel: 'Weights on disk guide',
  },
  {
    name: 'Kernels and compilers',
    question: 'What makes the math fast enough?',
    players: 'CUDA, Triton, CUTLASS, FlashAttention, Metal, MLX kernels',
    href: '/docs/technical-guides/kernel-reading',
    linkLabel: 'Kernel reading guide',
  },
  {
    name: 'Runtime and serving',
    question: 'How does inference run reliably and cheaply?',
    players: 'llama.cpp, MLX, Ollama, LM Studio, vLLM, SGLang, Ray Serve',
    href: '/docs/build-and-run/runtime-map',
    linkLabel: 'Runtime map',
  },
  {
    name: 'Apps, agents, and devices',
    question: 'Where does the model run for users?',
    players: 'Phones, laptops, browsers, local agents, enterprise apps',
    href: '/docs/build-and-run/bonsai-studio-ios',
    linkLabel: 'Bonsai Studio on iPhone',
  },
  {
    name: 'Evaluation and feedback',
    question: 'How do we know it works and keeps improving?',
    players: 'Preference workflows, Arena-style evals, regression suites',
    href: '/docs/prismml/whitepaper-benchmarks',
    linkLabel: 'Whitepaper benchmarks',
  },
]

const LENSES = [
  {
    name: 'Ion Stoica',
    stages: [1, 3, 6, 8],
    light: 'stroke-cyan-600',
    fill: 'fill-cyan-600',
  },
  {
    name: 'Vinod Khosla',
    stages: [4, 5, 6, 7],
    light: 'stroke-emerald-600',
    fill: 'fill-emerald-600',
  },
  {
    name: 'PrismML',
    stages: [2, 4, 6, 7],
    light: 'stroke-violet-600 dark:stroke-violet-500',
    fill: 'fill-violet-600 dark:fill-violet-500',
  },
]

const ROW_H = 52
const BOX_W = 232
const BOX_H = 36
const BOX_X = 96
const LENS_X0 = 360
const LENS_DX = 46
const TOP = 92

export function SupplyChainDiagram() {
  const [selected, setSelected] = useState(6) // runtime and serving: the layer most readers touch first
  const height = TOP + STAGES.length * ROW_H + 8
  const rowY = (i: number) => TOP + i * ROW_H
  const stage = STAGES[selected]

  return (
    <figure className="my-8">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 560 ${height}`}
          role="img"
          aria-label="The nine supply-chain stages flow into each other, evaluation feeds back to data and training, and three lenses each attach to four stages. Click a stage to see its details."
          className="mx-auto w-full max-w-xl font-sans"
        >
          <defs>
            <marker id="sc-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0 0L8 4L0 8z" className="fill-slate-400 dark:fill-slate-500" />
            </marker>
          </defs>

          {STAGES.map((s, i) => (
            <g
              key={s.name}
              onClick={() => setSelected(i)}
              className="cursor-pointer"
              role="button"
              aria-label={`Show details for ${s.name}`}
            >
              {i > 0 && (
                <line
                  x1={BOX_X + BOX_W / 2}
                  y1={rowY(i - 1) + BOX_H}
                  x2={BOX_X + BOX_W / 2}
                  y2={rowY(i) - 3}
                  strokeWidth={1.5}
                  markerEnd="url(#sc-arrow)"
                  className="stroke-slate-400 dark:stroke-slate-500"
                />
              )}
              <rect
                x={BOX_X}
                y={rowY(i)}
                width={BOX_W}
                height={BOX_H}
                rx={6}
                strokeWidth={i === selected ? 2 : 1}
                className={
                  i === selected
                    ? 'fill-violet-50 stroke-violet-600 dark:fill-violet-500/15 dark:stroke-violet-400'
                    : 'fill-slate-50 stroke-slate-300 hover:stroke-slate-500 dark:fill-slate-800 dark:stroke-slate-600 dark:hover:stroke-slate-400'
                }
              />
              <text
                x={BOX_X + BOX_W / 2}
                y={rowY(i) + BOX_H / 2 + 4}
                textAnchor="middle"
                fontSize={12.5}
                className={
                  i === selected
                    ? 'fill-violet-800 font-semibold dark:fill-violet-200'
                    : 'fill-slate-700 dark:fill-slate-200'
                }
              >
                {s.name}
              </text>
            </g>
          ))}

          {[1, 3].map((target) => (
            <path
              key={target}
              d={`M ${BOX_X} ${rowY(8) + BOX_H / 2} C ${BOX_X - 62} ${rowY(8)}, ${BOX_X - 62} ${rowY(target) + BOX_H}, ${BOX_X - 4} ${rowY(target) + BOX_H / 2}`}
              fill="none"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              markerEnd="url(#sc-arrow)"
              className="stroke-slate-400 dark:stroke-slate-500"
            />
          ))}
          <text x={20} y={rowY(5) + BOX_H / 2} fontSize={11} className="fill-slate-500 dark:fill-slate-400">
            feedback
          </text>

          {LENSES.map((lens, li) => {
            const x = LENS_X0 + li * LENS_DX
            const first = Math.min(...lens.stages)
            const last = Math.max(...lens.stages)
            return (
              <g key={lens.name}>
                <text
                  x={x - 4}
                  y={TOP - 16}
                  fontSize={11.5}
                  fontWeight={600}
                  textAnchor="start"
                  transform={`rotate(-38 ${x - 4} ${TOP - 16})`}
                  className="fill-slate-700 dark:fill-slate-200"
                >
                  {lens.name}
                </text>
                <line
                  x1={x}
                  y1={rowY(first) + BOX_H / 2}
                  x2={x}
                  y2={rowY(last) + BOX_H / 2}
                  strokeWidth={2}
                  className={lens.light}
                />
                {lens.stages.map((s) => (
                  <g key={s}>
                    <line
                      x1={BOX_X + BOX_W + 4}
                      y1={rowY(s) + BOX_H / 2}
                      x2={x - 5}
                      y2={rowY(s) + BOX_H / 2}
                      strokeWidth={1}
                      strokeDasharray="2 3"
                      className="stroke-slate-300 dark:stroke-slate-600"
                    />
                    <circle cx={x} cy={rowY(s) + BOX_H / 2} r={4} className={lens.fill}>
                      <title>{`${lens.name}: ${STAGES[s].name}`}</title>
                    </circle>
                  </g>
                ))}
              </g>
            )
          })}
        </svg>
      </div>

      <div className="mx-auto mt-2 max-w-xl rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          {stage.name}
        </p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {stage.question}
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Who lives here: {stage.players}.
        </p>
        <p className="mt-2 text-sm">
          <Link
            href={stage.href}
            className="font-medium text-violet-700 hover:text-violet-600 dark:text-violet-400 dark:hover:text-violet-300"
          >
            {stage.linkLabel} &rarr;
          </Link>
        </p>
      </div>
      <figcaption className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
        Click a stage to see what it does and where to read more. Dots mark the
        stages each viewpoint cares about most.
      </figcaption>
    </figure>
  )
}
