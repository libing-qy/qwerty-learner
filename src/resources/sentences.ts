import type { SentenceItem } from '@/typings'

const sentenceResourceMap: Record<string, string> = {
  cet4: '/sentences/cet4.json',
}

const sentenceCountMap: Record<string, number> = {
  cet4: 7,
}

export const getSentenceResourceUrl = (dictId: string) => sentenceResourceMap[dictId]

export const getSentenceCountByDictId = (dictId: string) => sentenceCountMap[dictId] ?? 0

export const normalizeSentenceItems = (items: unknown): SentenceItem[] => {
  if (!Array.isArray(items)) return []

  return items.filter((item): item is SentenceItem => {
    if (!item || typeof item !== 'object') return false

    const sentence = item as SentenceItem
    return Boolean(
      sentence.id &&
        sentence.text &&
        typeof sentence.trans === 'string' &&
        typeof sentence.chapter === 'number' &&
        typeof sentence.sourceDictId === 'string' &&
        Array.isArray(sentence.tokens) &&
        sentence.tokens.length > 0 &&
        sentence.tokens.every((token) => typeof token === 'string' && token.trim().length > 0),
    )
  })
}
