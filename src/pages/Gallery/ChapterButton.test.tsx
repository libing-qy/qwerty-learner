import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const noop = vi.fn()

vi.mock('./hooks/useChapterStats', () => ({
  useChapterStats: () => null,
}))

vi.mock('@/hooks/useIntersectionObserver', () => ({
  default: () => ({ isIntersecting: true }),
}))

describe('ChapterButton', () => {
  it('renders a provided custom chapter title', async () => {
    const { ChapterButton } = await import('./ChapterButton')

    render(<ChapterButton index={0} title="Speaking Activity" selected={false} wordCount={37} onClick={noop} />)

    expect(screen.getByText('Speaking Activity')).toBeInTheDocument()
    expect(screen.queryByText('Chapter 1')).not.toBeInTheDocument()
  })
})
