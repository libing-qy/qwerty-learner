import { getSentenceResourceUrl, normalizeSentenceItems } from './sentences'
import { describe, expect, it } from 'vitest'

describe('sentence resources', () => {
  it('returns the expected resource url for a supported dictionary', () => {
    expect(getSentenceResourceUrl('cet4')).toBe('/sentences/cet4.json')
  })

  it('normalizes sentence items and filters invalid tokens', () => {
    const items = normalizeSentenceItems([
      {
        id: 'cet4-0-0',
        text: 'cancel the plan',
        tokens: ['cancel', 'the', 'plan'],
        trans: '取消计划',
        chapter: 0,
        sourceDictId: 'cet4',
      },
      {
        id: 'invalid',
        text: '',
        tokens: [],
        trans: 'bad',
        chapter: 0,
        sourceDictId: 'cet4',
      },
    ])

    expect(items).toHaveLength(1)
    expect(items[0]?.tokens).toEqual(['cancel', 'the', 'plan'])
  })
})
