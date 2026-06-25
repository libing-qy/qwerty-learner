import { currentChapterAtom, currentDictIdAtom, randomConfigAtom, reviewModeInfoAtom } from '@/store'
import { fireEvent, render, screen } from '@testing-library/react'
import { Provider, createStore } from 'jotai'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'

type ChildrenProps = {
  children: ReactNode
}

const mockWords = [{ name: 'cancel', trans: ['取消'], usphone: '', ukphone: '', index: 0 }]
const mockSentences = [
  {
    id: 'cet4-0-0',
    text: 'cancel the plan',
    tokens: ['cancel', 'the', 'plan'],
    trans: '取消计划',
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
vi.mock('./components/WordPanel/components/Word', () => ({
  default: ({ onFinish }: { onFinish: () => void }) => (
    <button type="button" onClick={onFinish}>
      finish-word
    </button>
  ),
}))
vi.mock('./components/WordPanel/components/Phonetic', () => ({ default: () => null }))
vi.mock('./components/WordPanel/components/Translation', () => ({ default: () => null }))
vi.mock('./components/PrevAndNextWord', () => ({ default: () => null }))
vi.mock('./components/PrevAndNextSentence', () => ({ default: () => null }))
vi.mock('./components/Progress', () => ({ default: () => null }))
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
    isLegal: () => true,
  }
})

it('switches to sentence mode after finishing the final word when sentences exist', async () => {
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

  fireEvent.click(screen.getByText('finish-word'))

  expect(screen.getByText('取消计划')).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: 'sentence-token-input' })).toBeInTheDocument()
})
