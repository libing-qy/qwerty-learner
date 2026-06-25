import PrevAndNextSentence from './index'
import { TypingContext, initialState } from '@/pages/Typing/store'
import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('@/components/Tooltip', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

it('renders previous and next sentence options and jumps on click', () => {
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
    {
      id: 'cet4-0-1',
      text: 'the audience remained silent',
      tokens: ['the', 'audience', 'remained', 'silent'],
      trans: '观众保持安静',
      chapter: 0,
      sourceDictId: 'cet4',
    },
    {
      id: 'cet4-0-2',
      text: 'persistent practice improves typing speed',
      tokens: ['persistent', 'practice', 'improves', 'typing', 'speed'],
      trans: '持续练习能提高打字速度',
      chapter: 0,
      sourceDictId: 'cet4',
    },
  ]
  state.sentenceData.index = 1

  const dispatch = vi.fn()

  render(
    <TypingContext.Provider value={{ state, dispatch }}>
      <div>
        <PrevAndNextSentence type="prev" />
        <PrevAndNextSentence type="next" />
      </div>
    </TypingContext.Provider>,
  )

  expect(screen.getByText('cancel the plan')).toBeInTheDocument()
  expect(screen.getByText('取消计划')).toBeInTheDocument()
  expect(screen.getByText('persistent practice improves typing speed')).toBeInTheDocument()
  expect(screen.getByText('持续练习能提高打字速度')).toBeInTheDocument()

  fireEvent.click(screen.getByText('persistent practice improves typing speed'))

  expect(dispatch).toHaveBeenCalledWith({ type: 'SKIP_2_SENTENCE_INDEX', newIndex: 2 })
})
