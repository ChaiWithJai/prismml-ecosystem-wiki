'use client'

import { usePathname } from 'next/navigation'

import { navigation } from '@/lib/navigation'

type DocsFrontmatter = {
  title?: string
  status?: string
  last_reviewed?: string | Date
}

const DRAFT_STATUSES = new Set([
  'draft',
  'partial',
  'not_run',
  'not_verified',
  'seed',
  'needs_review',
])

function formatDate(value: string | Date) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return value.slice(0, 10)
  }

  return value
}

export function DocsHeader({ frontmatter }: { frontmatter: DocsFrontmatter }) {
  let pathname = usePathname()
  let section = navigation.find((section) =>
    section.links.find((link) => link.href === pathname),
  )
  let { title, status, last_reviewed } = frontmatter
  let isDraft = status ? DRAFT_STATUSES.has(status) : false

  if (!title && !section) {
    return null
  }

  return (
    <header className="mb-9 space-y-1">
      {section && (
        <p className="font-display text-sm font-medium text-violet-600 dark:text-violet-400">
          {section.title}
        </p>
      )}
      {title && (
        <h1 className="font-display text-3xl tracking-tight text-slate-900 dark:text-white">
          {title}
        </h1>
      )}
      {(isDraft || last_reviewed) && (
        <p className="flex items-center gap-2 pt-1 text-sm text-slate-500 dark:text-slate-400">
          {isDraft && (
            <span className="inline-flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Draft
            </span>
          )}
          {isDraft && last_reviewed && <span aria-hidden="true">&middot;</span>}
          {last_reviewed && <span>Updated {formatDate(last_reviewed)}</span>}
        </p>
      )}
    </header>
  )
}
