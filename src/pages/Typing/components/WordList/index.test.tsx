import { TypingContext, initialState } from '@/pages/Typing/store'
import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('@/components/Drawer', () => ({
  default: ({ open, children }: { open: boolean; children: React.ReactNode }) => (open ? <div>{children}</div> : null),
}))

vi.mock('@/components/Tooltip', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@headlessui/react', () => ({
  Dialog: {
    Title: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
}))

vi.mock('./WordCard', () => ({
  default: ({ word, onClick }: { word: { name: string; trans: string[] }; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      <span>{word.name}</span>
      <span>{word.trans.join('；')}</span>
    </button>
  ),
}))

it('renders sentence items in sentence mode and dispatches sentence jump', async () => {
  const { default: WordList } = await import('./index')
  const state = structuredClone(initialState)
  state.trainingMode = 'sentence-order'
  state.sentenceData.sentences = [
    {
      id: 'cet4-0-0',
      text: 'cancel the plan',
      tokens: ['cancel', 'the', 'plan'],
      trans: '取消计划',
      chapter: 0,
      sourceDictId: 'cet4',
    },
  ]

  const dispatch = vi.fn()

  render(
    <TypingContext.Provider value={{ state, dispatch }}>
      <WordList />
    </TypingContext.Provider>,
  )

  fireEvent.click(screen.getAllByRole('button')[0])
  expect(screen.getByText('cancel the plan')).toBeInTheDocument()
  expect(screen.getByText('取消计划')).toBeInTheDocument()
  fireEvent.click(screen.getByText('cancel the plan'))

  expect(dispatch).toHaveBeenCalledWith({ type: 'SKIP_2_SENTENCE_INDEX', newIndex: 0 })
})

it('renders word items in word mode and dispatches word jump', async () => {
  const { default: WordList } = await import('./index')
  const state = structuredClone(initialState)
  state.trainingMode = 'word'
  state.chapterData.words = [{ name: 'cancel', trans: ['取消'], usphone: '', ukphone: '', index: 0 }]

  const dispatch = vi.fn()

  render(
    <TypingContext.Provider value={{ state, dispatch }}>
      <WordList />
    </TypingContext.Provider>,
  )

  fireEvent.click(screen.getAllByRole('button')[0])
  fireEvent.click(screen.getByText('cancel'))

  expect(dispatch).toHaveBeenCalledWith({ type: 'SKIP_2_WORD_INDEX', newIndex: 0 })
})
