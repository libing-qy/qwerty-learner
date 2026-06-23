import { filterSentencesByChapter } from './useSentenceList'
import { describe, expect, it } from 'vitest'

describe('filterSentencesByChapter', () => {
  it('returns only current chapter sentences', () => {
    const sentences = [
      { id: 'a', text: 'cancel the plan', tokens: ['cancel', 'the', 'plan'], trans: '取消计划', chapter: 0, sourceDictId: 'cet4' },
      {
        id: 'b',
        text: 'remote work helps',
        tokens: ['remote', 'work', 'helps'],
        trans: '远程工作有帮助',
        chapter: 1,
        sourceDictId: 'cet4',
      },
    ]

    expect(filterSentencesByChapter(sentences, 0)).toHaveLength(1)
    expect(filterSentencesByChapter(sentences, 0)[0]?.id).toBe('a')
  })
})
