import withMarkdoc from '@markdoc/next.js'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import withSearch from './src/markdoc/search.mjs'

const projectRoot = dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'ts', 'tsx'],
  output: 'export',
  outputFileTracingRoot: projectRoot,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

export default withSearch(
  withMarkdoc({ schemaPath: './src/markdoc', nextjsExports: ['revalidate'] })(
    nextConfig,
  ),
)
