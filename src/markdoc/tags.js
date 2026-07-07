import { Callout } from '@/components/Callout'
import { QuickLink, QuickLinks } from '@/components/QuickLinks'
import { SupplyChainDiagram } from '@/components/diagrams/SupplyChainDiagram'
import { KVCacheDiagram } from '@/components/diagrams/KVCacheDiagram'
import { FrontierDiagram } from '@/components/diagrams/FrontierDiagram'
import { SystemModel } from '@/components/diagrams/SystemModel'
import { ConceptDiagram } from '@/components/diagrams/ConceptDiagrams'

const tags = {
  callout: {
    attributes: {
      title: { type: String },
      type: {
        type: String,
        default: 'note',
        matches: ['note', 'warning'],
        errorLevel: 'critical',
      },
    },
    render: Callout,
  },
  figure: {
    selfClosing: true,
    attributes: {
      src: { type: String },
      alt: { type: String },
      caption: { type: String },
    },
    render: ({ src, alt = '', caption }) => (
      <figure>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} />
        <figcaption>{caption}</figcaption>
      </figure>
    ),
  },
  'quick-links': {
    render: QuickLinks,
  },
  'quick-link': {
    selfClosing: true,
    render: QuickLink,
    attributes: {
      title: { type: String },
      description: { type: String },
      icon: { type: String },
      href: { type: String },
    },
  },
  'supply-chain-diagram': {
    selfClosing: true,
    render: SupplyChainDiagram,
  },
  'kv-cache-diagram': {
    selfClosing: true,
    render: KVCacheDiagram,
  },
  'frontier-diagram': {
    selfClosing: true,
    render: FrontierDiagram,
  },
  'system-model': {
    selfClosing: true,
    attributes: {
      highlight: { type: String },
    },
    render: SystemModel,
  },
  'concept-diagram': {
    selfClosing: true,
    attributes: {
      name: { type: String },
    },
    render: ConceptDiagram,
  },
}

export default tags
