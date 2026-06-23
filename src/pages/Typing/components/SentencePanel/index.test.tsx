import SentencePanel from './index'
import { TypingContext, initialState } from '@/pages/Typing/store'
import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'

it('renders scrambled tokens and accepts keyboard token submission', () => {
  const state = structuredClone(initialState)
  state.trainingMode = 'sentence-order'
  state.isTyping = true
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
  state.sentenceData.userInputLogs = [{ index: 0, correctCount: 0, wrongCount: 0, wrongTokens: [] }]

  const dispatch = vi.fn()

  render(
    <TypingContext.Provider value={{ state, dispatch }}>
      <SentencePanel />
    </TypingContext.Provider>,
  )

  expect(screen.getByText('取消计划')).toBeInTheDocument()
  expect(screen.getByText('plan')).toBeInTheDocument()

  const input = screen.getByRole('textbox', { name: 'sentence-token-input' })
  fireEvent.change(input, { target: { value: 'cancel' } })
  fireEvent.keyDown(input, { key: ' ', code: 'Space' })

  expect(dispatch).toHaveBeenCalled()
})
