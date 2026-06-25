import { TypingStateActionType, initialState } from './store'
import { currentChapterAtom, currentDictIdAtom, randomConfigAtom, reviewModeInfoAtom } from '@/store'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Provider, createStore } from 'jotai'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

type ChildrenProps = {
  children: ReactNode
}

const mockDispatch = vi.fn()
let mockState = structuredClone(initialState)
let mockSentences: Array<{
  id: string
  text: string
  tokens: string[]
  trans: string
  chapter: number
  sourceDictId: string
}> = []

const mockWord = { name: 'cancel', trans: ['取消'], usphone: '', ukphone: '', index: 0 }
const mockSentence = {
  id: 'cet4-0-0',
  text: 'cancel the plan',
  tokens: ['cancel', 'the', 'plan'],
  trans: '取消计划',
  chapter: 0,
  sourceDictId: 'cet4',
}

vi.mock('./hooks/useWordList', () => ({
  useWordList: () => ({
    words: [mockWord],
  }),
}))

vi.mock('./hooks/useSentenceList', () => ({
  useSentenceList: () => ({
    sentences: mockSentences,
  }),
}))

vi.mock('use-immer', () => ({
  useImmerReducer: () => [mockState, mockDispatch],
}))

vi.mock('@/components/DonateCard', () => ({ DonateCard: () => null }))
vi.mock('@/components/Header', () => ({ default: ({ children }: ChildrenProps) => <div>{children}</div> }))
vi.mock('../../components/Layout', () => ({ default: ({ children }: ChildrenProps) => <div>{children}</div> }))
vi.mock('@/components/Tooltip', () => ({ default: ({ children }: ChildrenProps) => <>{children}</> }))
vi.mock('./components/DictChapterButton', () => ({ DictChapterButton: () => <div>DictChapterButton</div> }))
vi.mock('./components/PronunciationSwitcher', () => ({ default: () => <div>PronunciationSwitcher</div> }))
vi.mock('./components/ResultScreen', () => ({ default: () => null }))
vi.mock('./components/Speed', () => ({ default: () => null }))
vi.mock('./components/StartButton', () => ({ default: () => <button type="button">StartButton</button> }))
vi.mock('./components/Switcher', () => ({ default: () => <div>Switcher</div> }))
vi.mock('./components/WordList', () => ({ default: () => null }))
vi.mock('./components/WordPanel', () => ({ default: () => <div>WordPanel</div> }))
vi.mock('./hooks/useConfetti', () => ({ useConfetti: () => undefined }))
vi.mock('@/utils/db', () => ({ useSaveChapterRecord: () => vi.fn() }))
vi.mock('@/utils/mixpanel', () => ({ useMixPanelChapterLogUploader: () => vi.fn() }))
vi.mock('@/utils', () => ({ IsDesktop: () => true, isLegal: () => true }))

const renderApp = async (isReviewMode = false) => {
  const { default: App } = await import('./index')
  const store = createStore()
  store.set(currentDictIdAtom, 'cet4')
  store.set(currentChapterAtom, 0)
  store.set(randomConfigAtom, { isOpen: false })
  store.set(reviewModeInfoAtom, { isReviewMode, reviewRecord: undefined })

  render(
    <MemoryRouter>
      <Provider store={store}>
        <App />
      </Provider>
    </MemoryRouter>,
  )
}

const createVisibleSkipState = (trainingMode: 'word' | 'sentence-order') => ({
  ...structuredClone(initialState),
  trainingMode,
  isShowSkip: true,
})

describe('Typing mode switcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockState = structuredClone(initialState)
    mockSentences = [mockSentence]
  })

  it('renders both buttons and dispatches mode switch actions', async () => {
    mockState = {
      ...structuredClone(initialState),
      trainingMode: 'word',
    }

    await renderApp()

    const sentenceButton = screen.getByRole('button', { name: '句子练习' })

    expect(screen.getByRole('button', { name: '单词练习' })).toBeInTheDocument()
    expect(sentenceButton).toBeEnabled()
    expect(screen.getByText('DictChapterButton')).toBeInTheDocument()
    expect(screen.getByText('PronunciationSwitcher')).toBeInTheDocument()
    expect(screen.getByText('Switcher')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'StartButton' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument()

    mockDispatch.mockClear()

    fireEvent.click(sentenceButton)
    expect(mockDispatch).toHaveBeenCalledWith({
      type: TypingStateActionType.SWITCH_TO_SENTENCE_MODE,
    })

    mockDispatch.mockClear()
    cleanup()
    mockState = {
      ...structuredClone(initialState),
      trainingMode: 'sentence-order',
    }

    await renderApp()

    fireEvent.click(screen.getByRole('button', { name: '单词练习' }))
    expect(mockDispatch).toHaveBeenCalledWith({
      type: TypingStateActionType.SWITCH_TO_WORD_MODE,
    })
  })

  it('does not dispatch when clicking the already-active mode button', async () => {
    mockState = {
      ...structuredClone(initialState),
      trainingMode: 'sentence-order',
    }

    await renderApp()
    mockDispatch.mockClear()

    fireEvent.click(screen.getByRole('button', { name: '句子练习' }))
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('does not dispatch when clicking the already-active word mode button', async () => {
    mockState = {
      ...structuredClone(initialState),
      trainingMode: 'word',
    }

    await renderApp()
    mockDispatch.mockClear()

    fireEvent.click(screen.getByRole('button', { name: '单词练习' }))
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('disables the sentence button when no sentence data exists', async () => {
    mockSentences = []

    await renderApp()

    expect(screen.getByRole('button', { name: '句子练习' })).toBeDisabled()
  })

  it('hides the mode switcher in review mode', async () => {
    mockState = {
      ...structuredClone(initialState),
      trainingMode: 'sentence-order',
    }

    await renderApp(true)

    fireEvent.click(screen.getByRole('button', { name: '单词练习' }))
    expect(mockDispatch).toHaveBeenCalledWith({
      type: TypingStateActionType.SWITCH_TO_WORD_MODE,
    })
    expect(screen.queryByRole('button', { name: '句子练习' })).not.toBeInTheDocument()
  })

  it('does not render the mode switcher after finishing', async () => {
    mockState = {
      ...structuredClone(initialState),
      isFinished: true,
    }

    await renderApp()

    expect(screen.queryByRole('button', { name: '单词练习' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '句子练习' })).not.toBeInTheDocument()
  })

  it('keeps skip dispatching word skip in word mode', async () => {
    mockState = createVisibleSkipState('word')

    await renderApp()

    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))

    expect(mockDispatch).toHaveBeenCalledWith({
      type: TypingStateActionType.SKIP_WORD,
    })
  })

  it('keeps skip dispatching next sentence in sentence mode', async () => {
    mockState = createVisibleSkipState('sentence-order')

    await renderApp()

    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))

    expect(mockDispatch).toHaveBeenCalledWith({
      type: TypingStateActionType.NEXT_SENTENCE,
    })
  })

  it('does not auto-start typing when switching modes while stopped', async () => {
    mockState = {
      ...structuredClone(initialState),
      trainingMode: 'word',
      isTyping: false,
    }

    await renderApp()
    mockDispatch.mockClear()

    fireEvent.click(screen.getByRole('button', { name: '句子练习' }))

    expect(mockDispatch).toHaveBeenNthCalledWith(1, {
      type: TypingStateActionType.SWITCH_TO_SENTENCE_MODE,
    })
    expect(mockDispatch).toHaveBeenNthCalledWith(2, {
      type: TypingStateActionType.SET_IS_TYPING,
      payload: false,
    })
  })
})
