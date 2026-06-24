import type { Dictionary } from '@/typings'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/hooks/useIntersectionObserver', () => ({
  default: () => ({ isIntersecting: true }),
}))

vi.mock('./DictDetail', () => ({
  default: () => <div>Dict detail</div>,
}))

vi.mock('./DictDetail/index', () => ({
  default: () => <div>Dict detail</div>,
}))

vi.mock('./hooks/useDictStats', () => ({
  useDictStats: () => null,
}))

vi.mock('jotai', async () => {
  const actual = await vi.importActual('jotai')
  return {
    ...actual,
    useAtomValue: () => 'not-selected',
  }
})

const baseDictionary: Dictionary = {
  id: 'cet4',
  name: 'CET-4',
  description: '大学英语四级词库',
  category: '中国考试',
  tags: ['大学英语'],
  url: '/dicts/CET4_T.json',
  length: 2607,
  chapterCount: 131,
  language: 'en',
  languageCategory: 'en',
}

describe('DictionaryWithoutCover', () => {
  it('shows both word count and sentence count for supported dictionaries', async () => {
    const { default: DictionaryWithoutCover } = await import('./DictionaryWithoutCover')

    render(<DictionaryWithoutCover dictionary={baseDictionary} />)

    expect(screen.getByText('2607 词 · 7 句')).toBeInTheDocument()
  })

  it('shows zero sentences when the dictionary has no sentence resource', async () => {
    const { default: DictionaryWithoutCover } = await import('./DictionaryWithoutCover')

    render(<DictionaryWithoutCover dictionary={{ ...baseDictionary, id: 'cet6', name: 'CET-6' }} />)

    expect(screen.getByText('2607 词 · 0 句')).toBeInTheDocument()
  })
})
