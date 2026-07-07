// Postbuild generator for agent-facing artifacts:
//   out/docs/**.md twins, out/index.md, out/llms.txt, out/docs/llms.txt,
//   out/llms-full.txt, out/sitemap.xml
// Reads the nav from src/lib/navigation.ts so section order stays canonical.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'

const SITE_URL = process.env.SITE_URL || 'https://yourwildcard.ai'
const ROOT = process.cwd()
const OUT = join(ROOT, 'out')

// --- parse navigation.ts (title/href pairs inside section blocks) ---
const navSrc = readFileSync(join(ROOT, 'src/lib/navigation.ts'), 'utf8')
const sectionMarks = [...navSrc.matchAll(/title:\s*'([^']+)',\s*\n\s*links:\s*\[/g)].map(
  (m) => ({ title: m[1], index: m.index }),
)
const sections = sectionMarks.map((s) => ({ title: s.title, links: [] }))
for (const m of navSrc.matchAll(/title:\s*'([^']+)',\s*\n?\s*href:\s*'([^']+)'/g)) {
  let si = -1
  for (let i = 0; i < sectionMarks.length; i++) {
    if (sectionMarks[i].index < m.index) si = i
  }
  if (si >= 0) sections[si].links.push({ title: m[1], href: m[2] })
}

function readPage(href) {
  const rel = href === '/' ? 'src/app/page.md' : `src/app${href}/page.md`
  const p = join(ROOT, rel)
  if (!existsSync(p)) return null
  const raw = readFileSync(p, 'utf8')
  const fm = raw.match(/^---\n([\s\S]*?)\n---\n/)
  const frontmatter = fm ? fm[1] : ''
  const body = fm ? raw.slice(fm[0].length) : raw
  return { frontmatter, body }
}

function stripMarkdoc(md) {
  return md
    .replace(/\{%\s*\.lead\s*%\}/g, '')
    .replace(/\{%\s*callout[^%]*%\}/g, '')
    .replace(/\{%\s*\/callout\s*%\}/g, '')
    .replace(/\{%\s*quick-links\s*%\}/g, '')
    .replace(/\{%\s*\/quick-links\s*%\}/g, '')
    .replace(
      /\{%\s*quick-link\s+title="([^"]+)"[^%]*href="([^"]+)"\s+description="([^"]+)"[^%]*%\}/g,
      '- [$1]($2): $3',
    )
    .replace(/\{%\s*(supply-chain-diagram|kv-cache-diagram|frontier-diagram)[^%]*\/%\}/g, '')
    .replace(/\{%\s*system-model[^%]*\/%\}/g, '')
    .replace(/\{%\s*concept-diagram[^%]*\/%\}/g, '')
    .replace(/\{%[^%]*%\}/g, '')
    .replace(/\n{3,}/g, '\n\n')
}

function rewriteLinks(md) {
  return md.replace(/\]\((\/docs\/[a-z0-9/-]+)\)/g, (_, r) => `](${SITE_URL}${r}.md)`)
    .replace(/\]\((\/whitepaper\/[^)]+)\)/g, (_, r) => `](${SITE_URL}${r})`)
}

function leadSentence(body) {
  const para = body
    .split('\n\n')
    .map((s) => s.trim())
    .find((s) => s && !s.startsWith('#') && !s.startsWith('{%') && !s.startsWith('|') && !s.startsWith('-'))
  if (!para) return ''
  const clean = stripMarkdoc(para).replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\s+/g, ' ').trim()
  const m = clean.match(/^.*?[.!?](\s|$)/)
  return (m ? m[0] : clean).trim()
}

// Blog posts: globbed from the filesystem, not the nav, so the sidebar stays small.
import { readdirSync, statSync } from 'node:fs'
const blogDir = join(ROOT, 'src/app/blog')
if (existsSync(blogDir)) {
  const posts = readdirSync(blogDir)
    .filter((d) => statSync(join(blogDir, d)).isDirectory())
    .filter((d) => existsSync(join(blogDir, d, 'page.md')))
    .sort()
  const links = posts.map((slug) => {
    const raw = readFileSync(join(blogDir, slug, 'page.md'), 'utf8')
    const title = raw.match(/^title:\s*["']?(.+?)["']?$/m)?.[1] ?? slug
    return { title, href: `/blog/${slug}` }
  })
  sections.push({ title: 'Blog', links: [{ title: 'Blog index', href: '/blog' }, ...links] })
}

const banner = `> Full documentation index: ${SITE_URL}/llms.txt\n> Use it to discover every page before exploring further.\n\n`
const pages = []
for (const s of sections) {
  for (const l of s.links) {
    const page = readPage(l.href)
    if (!page) continue
    const route = l.href === '/' ? '' : l.href
    const twinPath = l.href === '/' ? join(OUT, 'index.md') : join(OUT, `${route.slice(1)}.md`)
    const md = rewriteLinks(stripMarkdoc(page.body)).trim()
    const fm = `---\n${page.frontmatter}\nurl: ${route || '/'}\ncanonical_url: ${SITE_URL}${route || '/'}\n---\n\n`
    mkdirSync(dirname(twinPath), { recursive: true })
    writeFileSync(twinPath, fm + banner + md + '\n')
    pages.push({ section: s.title, title: l.title, href: l.href, route, description: leadSentence(page.body), fm: page.frontmatter, md })
  }
}

// --- llms.txt ---
let llms = `> Full documentation content: ${SITE_URL}/llms-full.txt\n\n# PrismML Developer Documentation\n\n> Community documentation for PrismML's Bonsai model family (1-bit Bonsai 8B, ternary variants, Bonsai Image 4B) and the local-inference supply chain that runs them. Every page is also available as raw Markdown by appending .md to its URL.\n\n- [1-bit Bonsai 8B whitepaper (PDF)](${SITE_URL}/whitepaper/1-bit-bonsai-8b-whitepaper.pdf): Primary source for architecture, benchmark, throughput, and energy claims.\n- [Bonsai 8B GGUF weights](https://huggingface.co/prism-ml/Bonsai-8B-gguf): Official 1.16 GB quantized weights for llama.cpp-compatible runtimes, Apache 2.0.\n\n`
let currentSection = ''
for (const p of pages) {
  if (p.href === '/') continue
  if (p.section !== currentSection) {
    currentSection = p.section
    llms += `\n## ${p.section}\n\n`
  }
  llms += `- [${p.title}](${SITE_URL}${p.route}.md)${p.description ? `: ${p.description}` : ''}\n`
}
writeFileSync(join(OUT, 'llms.txt'), llms)
mkdirSync(join(OUT, 'docs'), { recursive: true })
writeFileSync(join(OUT, 'docs', 'llms.txt'), llms)

// --- llms-full.txt ---
const full = [
  `# PrismML Developer Documentation - full content. Index: ${SITE_URL}/llms.txt`,
  ...pages.map((p) => `---\n${p.fm}\ncanonical_url: ${SITE_URL}${p.route || '/'}\n---\n\n# ${p.title}\n\n${p.md}`),
].join('\n\n---\n\n')
writeFileSync(join(OUT, 'llms-full.txt'), full + '\n')

// --- sitemap.xml ---
const lastmod = (fm) => fm.match(/last_reviewed:\s*(\S+)/)?.[1] || '2026-07-06'
const urls = pages
  .map((p) => `  <url><loc>${SITE_URL}${p.route || ''}/</loc><lastmod>${lastmod(p.fm)}</lastmod></url>`)
  .join('\n')
writeFileSync(
  join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
)

console.log(`agent artifacts: ${pages.length} md twins, llms.txt (${llms.length} bytes), llms-full.txt (${full.length} bytes), sitemap.xml`)

// --- SEO/AEO enhancement pass over the exported HTML ---
// The Markdoc loader does not export per-page metadata, so every page ships
// the global title/description. Rewrite each page's head at build time.
function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
let enhanced = 0
for (const p of pages) {
  const htmlPath = p.href === '/' ? join(OUT, 'index.html') : join(OUT, `${p.route.slice(1)}/index.html`)
  if (!existsSync(htmlPath)) continue
  let html = readFileSync(htmlPath, 'utf8')
  const pageTitle = p.href === '/' ? 'PrismML Developer' : `${p.title} - PrismML Developer`
  const desc = esc(p.description || 'PrismML Bonsai documentation.')
  const canonical = `${SITE_URL}${p.route || ''}/`
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(pageTitle)}</title>`)
  html = html.replace(
    /<meta name="description" content="[^"]*"\/>/,
    `<meta name="description" content="${desc}"/>`,
  )
  const lastmodMatch = p.fm.match(/last_reviewed:\s*(\S+)/)
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': p.href === '/' ? 'WebSite' : 'TechArticle',
    headline: p.title,
    name: pageTitle,
    description: p.description,
    url: canonical,
    dateModified: lastmodMatch ? lastmodMatch[1] : undefined,
    isPartOf: p.href === '/' ? undefined : { '@type': 'WebSite', name: 'PrismML Developer', url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'PrismML Developer (community)', url: SITE_URL },
  }
  const headExtras = [
    `<link rel="canonical" href="${canonical}"/>`,
    `<link rel="alternate" type="text/markdown" href="${SITE_URL}${p.route || '/index'}.md"/>`,
    `<meta property="og:title" content="${esc(pageTitle)}"/>`,
    `<meta property="og:description" content="${desc}"/>`,
    `<meta property="og:url" content="${canonical}"/>`,
    `<meta property="og:type" content="article"/>`,
    `<meta property="og:site_name" content="PrismML Developer"/>`,
    `<meta name="twitter:card" content="summary"/>`,
    `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>`,
  ].join('')
  html = html.replace('</head>', `${headExtras}</head>`)
  writeFileSync(htmlPath, html)
  enhanced += 1
}
console.log(`seo pass: ${enhanced} pages got titles, descriptions, canonicals, and JSON-LD`)
