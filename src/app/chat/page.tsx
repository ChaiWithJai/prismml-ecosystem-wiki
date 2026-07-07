import { type Metadata } from 'next'

import { DocsChat } from '@/components/DocsChat'

export const metadata: Metadata = {
  title: 'Ask the docs',
  description:
    'Chat with the PrismML docs, answered by 1-bit Bonsai 1.7B running in your browser over WebGPU.',
}

export default function ChatPage() {
  return (
    <>
      {/* the worker imports transformers.js from jsdelivr and weights from HF;
          warming the connections shaves the model-load start */}
      <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://huggingface.co" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://cdn-lfs.huggingface.co" crossOrigin="anonymous" />
      <DocsChat />
    </>
  )
}
