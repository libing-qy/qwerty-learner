import { normalizeSentenceItems } from '@/resources/sentences'
import type { SentenceItem } from '@/typings'

export async function sentenceListFetcher(url: string): Promise<SentenceItem[]> {
  const response = await fetch(url)
  const data = await response.json()
  return normalizeSentenceItems(data)
}
