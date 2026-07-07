import { Fragment } from 'react'
import clsx from 'clsx'
import { Highlight } from 'prism-react-renderer'

import { Button } from '@/components/Button'
import { HeroBackground } from '@/components/HeroBackground'

// Decorative glows as pure CSS gradients: replaces two ~220 KB PNGs that
// shipped with priority loading on every visit.
function BlurGlow({ className, color }: { className: string; color: 'cyan' | 'indigo' }) {
  return (
    <div
      aria-hidden="true"
      className={clsx('pointer-events-none absolute rounded-full', className)}
      style={{
        background:
          color === 'cyan'
            ? 'radial-gradient(closest-side, rgba(34,211,238,0.28), transparent)'
            : 'radial-gradient(closest-side, rgba(99,102,241,0.28), transparent)',
        filter: 'blur(24px)',
      }}
    />
  )
}

const codeLanguage = 'bash'
const code = `$ brew install llama.cpp

$ curl -LO https://huggingface.co/prism-ml/\\
    Bonsai-8B-gguf/resolve/main/Bonsai-8B-Q1_0.gguf
# 1.16 GB. An 8B model that fits in one download.

$ llama-cli -m Bonsai-8B-Q1_0.gguf \\
    -p "Why does the KV cache grow?"
The KV cache grows with context length because...

[ Prompt: 140 t/s | Generation: 65 t/s ]`

const tabs = [
  { name: 'run-bonsai.sh', isActive: true },
  { name: 'measured on a Mac M4 Pro', isActive: false },
]

function TrafficLightsIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 42 10" fill="none" {...props}>
      <circle cx="5" cy="5" r="4.5" />
      <circle cx="21" cy="5" r="4.5" />
      <circle cx="37" cy="5" r="4.5" />
    </svg>
  )
}

export function Hero() {
  return (
    <div className="overflow-hidden bg-slate-900 dark:-mt-19 dark:-mb-32 dark:pt-19 dark:pb-32">
      <div className="py-16 sm:px-2 lg:relative lg:px-0 lg:py-20">
        <div className="mx-auto grid max-w-2xl grid-cols-1 items-center gap-x-8 gap-y-16 px-4 lg:max-w-8xl lg:grid-cols-2 lg:px-8 xl:gap-x-16 xl:px-12">
          <div className="relative z-10 md:text-center lg:text-left">
            <BlurGlow
              color="cyan"
              className="right-full bottom-full -mr-72 -mb-56 h-[530px] w-[530px] opacity-40"
            />
            <div className="relative">
              <p className="inline bg-linear-to-r from-violet-300 via-cyan-300 to-emerald-300 bg-clip-text font-display text-5xl tracking-tight text-transparent">
                Run serious AI on hardware you already own.
              </p>
              <p className="mt-3 text-2xl tracking-tight text-slate-400">
                The developer guide to PrismML Bonsai and the small-model
                ecosystem: what to run, how to verify it, and where to
                contribute.
              </p>
              <div className="mt-8 flex flex-wrap gap-4 md:justify-center lg:justify-start">
                <Button href="/docs/build-and-run/bonsai-llamacpp">
                  Run Bonsai locally
                </Button>
                <Button
                  href="/docs/start-here/orientation"
                  variant="secondary"
                >
                  Explore the ecosystem
                </Button>
              </div>
              <p className="mt-6 text-sm text-slate-400 md:text-center lg:text-left">
                Learning paths:{' '}
                <a
                  href="https://chaiwithjai.github.io/inference-the-hard-way/"
                  className="font-medium text-sky-300 hover:text-sky-200"
                >
                  Inference The Hard Way
                </a>{' '}
                and{' '}
                <a
                  href="https://bootstrap-your-own-k8s.netlify.app"
                  className="font-medium text-sky-300 hover:text-sky-200"
                >
                  Kubernetes The Hard Way
                </a>
              </p>
            </div>
          </div>
          <div className="relative lg:static xl:pl-10">
            <div className="absolute inset-x-[-50vw] -top-32 -bottom-48 mask-[linear-gradient(transparent,white,white)] lg:-top-32 lg:right-0 lg:-bottom-32 lg:left-[calc(50%+14rem)] lg:mask-none dark:mask-[linear-gradient(transparent,white,transparent)] lg:dark:mask-[linear-gradient(white,white,transparent)]">
              <HeroBackground className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 lg:left-0 lg:translate-x-0 lg:translate-y-[-60%]" />
            </div>
            <div className="relative">
              <BlurGlow
                color="cyan"
                className="-top-64 -right-64 h-[530px] w-[530px]"
              />
              <BlurGlow
                color="indigo"
                className="-right-44 -bottom-40 h-[567px] w-[567px]"
              />
              <div className="absolute inset-0 rounded-2xl bg-linear-to-tr from-teal-300 via-sky-300/70 to-indigo-300 opacity-10 blur-lg" />
              <div className="absolute inset-0 rounded-2xl bg-linear-to-tr from-teal-300 via-sky-300/70 to-indigo-300 opacity-10" />
              <div className="relative rounded-2xl bg-[#0A101F]/80 ring-1 ring-white/10 backdrop-blur-sm">
                <div className="absolute -top-px right-11 left-20 h-px bg-linear-to-r from-teal-300/0 via-teal-300/70 to-teal-300/0" />
                <div className="absolute right-20 -bottom-px left-11 h-px bg-linear-to-r from-sky-400/0 via-sky-400 to-sky-400/0" />
                <div className="pt-4 pl-4">
                  <TrafficLightsIcon className="h-2.5 w-auto stroke-slate-500/30" />
                  <div className="mt-4 flex space-x-2 text-xs">
                    {tabs.map((tab) => (
                      <div
                        key={tab.name}
                        className={clsx(
                          'flex h-6 rounded-full',
                          tab.isActive
                            ? 'bg-linear-to-r from-teal-400/30 via-teal-400 to-sky-400/30 p-px font-medium text-teal-200'
                            : 'text-slate-500',
                        )}
                      >
                        <div
                          className={clsx(
                            'flex items-center rounded-full px-2.5',
                            tab.isActive && 'bg-slate-800',
                          )}
                        >
                          {tab.name}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex items-start px-1 text-sm">
                    <div
                      aria-hidden="true"
                      className="border-r border-slate-300/5 pr-4 font-mono text-slate-600 select-none"
                    >
                      {Array.from({ length: code.split('\n').length }).map(
                        (_, index) => (
                          <Fragment key={index}>
                            {(index + 1).toString().padStart(2, '0')}
                            <br />
                          </Fragment>
                        ),
                      )}
                    </div>
                    <Highlight
                      code={code}
                      language={codeLanguage}
                      theme={{ plain: {}, styles: [] }}
                    >
                      {({
                        className,
                        style,
                        tokens,
                        getLineProps,
                        getTokenProps,
                      }) => (
                        <pre
                          className={clsx(className, 'flex overflow-x-auto pb-6')}
                          style={style}
                        >
                          <code className="px-4">
                            {tokens.map((line, lineIndex) => (
                              <div key={lineIndex} {...getLineProps({ line })}>
                                {line.map((token, tokenIndex) => (
                                  <span
                                    key={tokenIndex}
                                    {...getTokenProps({ token })}
                                  />
                                ))}
                              </div>
                            ))}
                          </code>
                        </pre>
                      )}
                    </Highlight>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
