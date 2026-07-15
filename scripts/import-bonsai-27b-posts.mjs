import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const sourcePath = resolve(process.argv[2])
const { posts, sources, publishedDate } = await import(
  pathToFileURL(sourcePath)
)
const root = process.cwd()

function yaml(value) {
  return JSON.stringify(value)
}

function renderSection(section) {
  const lines = [`## ${section.heading}`, '']
  for (const paragraph of section.paragraphs ?? []) lines.push(paragraph, '')
  for (const bullet of section.bullets ?? []) lines.push(`- ${bullet}`)
  if (section.bullets?.length) lines.push('')
  if (section.code) lines.push('```bash', section.code, '```', '')
  if (section.links?.length) {
    for (const link of section.links) {
      lines.push(
        `- [${link.label}](${link.url})${link.note ? `, ${link.note}` : ''}`,
      )
    }
    lines.push('')
  }
  return lines.join('\n')
}

function renderPost(post) {
  const sourceLinks = post.sourceKeys
    .map((key) => sources[key])
    .filter(Boolean)
    .map((source) => `- [${source.label}](${source.url})`)
    .join('\n')
  const related = post.related
    .map((slug) => posts.find((item) => item.slug === slug))
    .filter(Boolean)
    .map((item) => `- [${item.title}](/blog/${item.slug})`)
    .join('\n')
  const faqs = post.faqs
    .map(([question, answer]) => `### ${question}\n\n${answer}`)
    .join('\n\n')

  return `---
title: ${yaml(post.title)}
description: ${yaml(post.description)}
audience: local-ai-builder
pillar: bonsai-27b
status: published
last_reviewed: ${publishedDate}
---

${post.answer} {% .lead %}

${post.sections.map(renderSection).join('\n')}
## Questions people ask

${faqs}

## Sources

${sourceLinks}

## Related Bonsai 27B lessons

${related || '- [Bonsai 27B field guide](/docs/prismml/bonsai-27b)'}

The benchmark numbers on this page describe one checkpoint, runtime, machine, and test shape. Reproduce the test on the hardware and workload you plan to use before making a product decision.
`
}

for (const post of posts) {
  const path = join(root, 'src', 'app', 'blog', post.slug, 'page.md')
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, renderPost(post))
}

console.log(`Imported ${posts.length} Bonsai 27B posts.`)
