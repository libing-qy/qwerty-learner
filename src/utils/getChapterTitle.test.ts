import { getChapterTitle } from './getChapterTitle'
import { describe, expect, it } from 'vitest'

describe('getChapterTitle', () => {
  it('returns a custom chapter title when configured', () => {
    expect(getChapterTitle(['Speaking Activity'], 0, 'zh')).toBe('Speaking Activity')
    expect(getChapterTitle(['Speaking Activity'], 0, 'en')).toBe('Speaking Activity')
  })

  it('falls back to the default localized title when no custom title exists', () => {
    expect(getChapterTitle(undefined, 0, 'zh')).toBe('第 1 章')
    expect(getChapterTitle([], 1, 'zh')).toBe('第 2 章')
    expect(getChapterTitle(undefined, 0, 'en')).toBe('Chapter 1')
    expect(getChapterTitle([], 1, 'en')).toBe('Chapter 2')
  })
})
