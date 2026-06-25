import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

const currentChapterAtom = Symbol('currentChapterAtom')
const currentDictInfoAtom = Symbol('currentDictInfoAtom')
const isReviewModeAtom = Symbol('isReviewModeAtom')

vi.mock('@/components/Tooltip', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/store', () => ({
  currentChapterAtom,
  currentDictInfoAtom,
  isReviewModeAtom,
}))

vi.mock('jotai', async () => {
  const actual = await vi.importActual<typeof import('jotai')>('jotai')

  return {
    ...actual,
    useAtom: (atom: unknown) => {
      if (atom === currentChapterAtom) {
        return [0, vi.fn()]
      }

      return [undefined, vi.fn()]
    },
    useAtomValue: (atom: unknown) => {
      if (atom === currentDictInfoAtom) {
        return {
          id: 'self-study_English1_00012',
          name: '自考英语一教材词汇 00012',
          chapterCount: 1,
          chapterTitles: ['Speaking Activity'],
        }
      }

      if (atom === isReviewModeAtom) {
        return false
      }

      return undefined
    },
  }
})

describe('DictChapterButton', () => {
  it('shows the custom speaking activity title for the 00012 dictionary', async () => {
    const { DictChapterButton } = await import('./index')

    render(
      <MemoryRouter>
        <DictChapterButton />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: 'Speaking Activity' })).toBeInTheDocument()
  })
})
