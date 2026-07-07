# PrismML Developer

Community documentation for PrismML's Bonsai model family and the local-inference ecosystem around it. Live at [prismml-ecosystem-wiki.netlify.app](https://prismml-ecosystem-wiki.netlify.app).

The site covers what to run, how to verify it, and where to contribute: runtime recipes for llama.cpp, MLX, Ollama, and LM Studio, technical guides from the KV cache to kernel reading, the whitepaper benchmarks explained in plain language, and a docs chat agent that runs 1-bit Bonsai 1.7B in your browser over WebGPU.

## Develop

```bash
npm ci
npm run dev        # local dev server
npm run build      # static export to out/
node scripts/generate-agent-artifacts.mjs   # llms.txt, .md twins, sitemap
```

Built with Next.js and Markdoc on the Tailwind Syntax template, exported as static files, deployed on Netlify from `main`.

## How the docs are organized

- `src/app/docs/**/page.md` — every page is Markdown with YAML frontmatter that records its verification status (`status`, `source_tier`, `benchmark_status`, `last_reviewed`).
- `src/lib/navigation.ts` — the sitemap; section order drives `llms.txt` and `sitemap.xml`.
- `src/components/diagrams/` — the canonical visualizations: one shared system model plus one concept diagram per technical guide.
- `public/chat-worker.mjs` and `src/components/DocsChat.tsx` — the in-browser chat agent (WebGPU, no server).
- `scripts/generate-agent-artifacts.mjs` — builds the agent pathway: `/llms.txt`, `/llms-full.txt`, raw `.md` twins for every page, and `sitemap.xml`.

## Ground rules for content

Facts come from official sources. A product claim appears only when it links to an official source with the date it was checked; claims that exist only on social media stay labeled as unconfirmed. Recipes that nobody has run on hardware say "not verified" and carry an acceptance test. See the [contributor guide](https://prismml-ecosystem-wiki.netlify.app/docs/contribute/contributor-guide) to add a page, a device report, or a correction.

## Sources

The [1-bit Bonsai 8B whitepaper](https://prismml-ecosystem-wiki.netlify.app/whitepaper/1-bit-bonsai-8b-whitepaper.pdf) (PrismML), the official PrismML model cards on Hugging Face, and the upstream documentation of every runtime covered. Bonsai models are Apache 2.0.
