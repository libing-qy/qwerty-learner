import { currentChapterAtom, currentDictIdAtom, randomConfigAtom, reviewModeInfoAtom } from '@/store'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider, createStore } from 'jotai'
import type { ReactNode } from 'react'
import { forwardRef } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'

type ChildrenProps = {
  children: ReactNode
}

const MockWordPronunciationIcon = forwardRef<HTMLDivElement>(() => null)
MockWordPronunciationIcon.displayName = 'MockWordPronunciationIcon'

let mockWords = [
  { name: 'a', trans: ['字母 a'], usphone: '', ukphone: '', index: 0 },
  { name: 'b', trans: ['字母 b'], usphone: '', ukphone: '', index: 1 },
]
let mockSentences = [
  {
    id: 'cet4-0-0',
    text: 'a plan',
    tokens: ['a', 'plan'],
    trans: '一个计划',
    chapter: 0,
    sourceDictId: 'cet4',
  },
]

vi.mock('./hooks/useWordList', () => ({
  useWordList: () => ({
    words: mockWords,
    isLoading: false,
    error: undefined,
  }),
}))

vi.mock('./hooks/useSentenceList', () => ({
  useSentenceList: () => ({
    sentences: mockSentences,
    isLoading: false,
    error: undefined,
  }),
}))

vi.mock('react-hotkeys-hook', () => ({
  useHotkeys: () => undefined,
}))

vi.mock('@/components/DonateCard', () => ({ DonateCard: () => null }))
vi.mock('@/components/Header', () => ({ default: ({ children }: ChildrenProps) => <div>{children}</div> }))
vi.mock('../../components/Layout', () => ({ default: ({ children }: ChildrenProps) => <div>{children}</div> }))
vi.mock('@/components/Tooltip', () => ({ default: ({ children }: ChildrenProps) => <>{children}</> }))
vi.mock('./components/DictChapterButton', () => ({ DictChapterButton: () => <div>DictChapterButton</div> }))
vi.mock('./components/PronunciationSwitcher', () => ({ default: () => <div>PronunciationSwitcher</div> }))
vi.mock('./components/ResultScreen', () => ({ default: () => null }))
vi.mock('./components/Speed', () => ({ default: () => null }))
vi.mock('./components/StartButton', () => ({ default: () => <div>StartButton</div> }))
vi.mock('./components/Switcher', () => ({ default: () => <div>Switcher</div> }))
vi.mock('./components/WordList', () => ({ default: () => null }))
vi.mock('@/components/WordPronunciationIcon', () => ({
  WordPronunciationIcon: MockWordPronunciationIcon,
}))
vi.mock('@/hooks/useKeySounds', () => ({
  default: () => [vi.fn(), vi.fn(), vi.fn()],
}))
vi.mock('./hooks/useConfetti', () => ({ useConfetti: () => undefined }))
vi.mock('@/hooks/usePronunciation', () => ({ usePrefetchPronunciationSound: () => undefined }))
vi.mock('@/utils/db', () => ({
  useSaveChapterRecord: () => vi.fn(),
  useSaveWordRecord: () => vi.fn(),
}))
vi.mock('@/utils/mixpanel', () => ({ useMixPanelChapterLogUploader: () => vi.fn() }))
vi.mock('@/utils', async () => {
  const actual = await vi.importActual('@/utils')
  return {
    ...actual,
    IsDesktop: () => true,
    isLegal: (value: string) => /^[a-z ]$/i.test(value),
  }
})

beforeEach(() => {
  mockWords = [
    { name: 'a', trans: ['字母 a'], usphone: '', ukphone: '', index: 0 },
    { name: 'b', trans: ['字母 b'], usphone: '', ukphone: '', index: 1 },
  ]
  mockSentences = [
    {
      id: 'cet4-0-0',
      text: 'a plan',
      tokens: ['a', 'plan'],
      trans: '一个计划',
      chapter: 0,
      sourceDictId: 'cet4',
    },
  ]
})

it('switches to sentence mode after typing through to the final word', async () => {
  const { default: App } = await import('./index')
  const store = createStore()
  store.set(currentDictIdAtom, 'cet4')
  store.set(currentChapterAtom, 0)
  store.set(randomConfigAtom, { isOpen: false })
  store.set(reviewModeInfoAtom, { isReviewMode: false, reviewRecord: undefined })

  render(
    <MemoryRouter>
      <Provider store={store}>
        <App />
      </Provider>
    </MemoryRouter>,
  )

  await waitFor(() => {
    expect(screen.getByText('a')).toBeInTheDocument()
  })

  fireEvent.keyDown(window, { key: 'a' })
  fireEvent.keyDown(window, { key: 'a' })

  await waitFor(() => {
    expect(screen.getByText('b')).toBeInTheDocument()
  })

  fireEvent.keyDown(window, { key: 'b' })

  await waitFor(() => {
    expect(screen.getByText('一个计划')).toBeInTheDocument()
  })

  expect(screen.getByRole('textbox', { name: 'sentence-token-input' })).toBeInTheDocument()
})
