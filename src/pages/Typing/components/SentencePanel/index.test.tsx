import SentencePanel from './index'
import * as keySoundsModule from '@/hooks/useKeySounds'
import { TypingContext, initialState } from '@/pages/Typing/store'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, vi } from 'vitest'

const playKeySound = vi.fn()
const playWrongSound = vi.fn()
const playCorrectSound = vi.fn()

vi.spyOn(keySoundsModule, 'default').mockReturnValue([playKeySound, playWrongSound, playCorrectSound])

beforeEach(() => {
  vi.clearAllMocks()
})

it('plays key sounds for each key and shows error feedback for a wrong token', () => {
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

  const input = screen.getByRole('textbox', { name: 'sentence-token-input' })

  fireEvent.keyDown(input, { key: 'w', code: 'KeyW' })
  fireEvent.change(input, { target: { value: 'wrong' } })
  fireEvent.keyDown(input, { key: ' ', code: 'Space' })

  expect(playKeySound).toHaveBeenCalledTimes(2)
  expect(playWrongSound).toHaveBeenCalledTimes(1)
  expect(dispatch).toHaveBeenCalledWith({
    type: 'REPORT_WRONG_TOKEN',
    payload: { token: 'wrong' },
  })
  expect(input).toHaveClass('border-red-500')
})

it('clears local sentence input when the active sentence changes', () => {
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
    {
      id: 'cet4-0-1',
      text: 'the audience remained silent',
      tokens: ['the', 'audience', 'remained', 'silent'],
      trans: '观众保持安静',
      chapter: 0,
      sourceDictId: 'cet4',
    },
  ]
  state.sentenceData.userInputLogs = [
    { index: 0, correctCount: 0, wrongCount: 0, wrongTokens: [] },
    { index: 1, correctCount: 0, wrongCount: 0, wrongTokens: [] },
  ]

  const dispatch = vi.fn()

  const { rerender } = render(
    <TypingContext.Provider value={{ state, dispatch }}>
      <SentencePanel />
    </TypingContext.Provider>,
  )

  const input = screen.getByRole('textbox', { name: 'sentence-token-input' })
  fireEvent.change(input, { target: { value: 'canc' } })
  expect(input).toHaveValue('canc')

  const nextState = structuredClone(state)
  nextState.sentenceData.index = 1

  rerender(
    <TypingContext.Provider value={{ state: nextState, dispatch }}>
      <SentencePanel />
    </TypingContext.Provider>,
  )

  expect(screen.getByRole('textbox', { name: 'sentence-token-input' })).toHaveValue('')
})

it('clears local sentence input when the training mode changes', () => {
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

  const { rerender } = render(
    <TypingContext.Provider value={{ state, dispatch }}>
      <SentencePanel />
    </TypingContext.Provider>,
  )

  const input = screen.getByRole('textbox', { name: 'sentence-token-input' })
  fireEvent.change(input, { target: { value: 'canc' } })
  expect(input).toHaveValue('canc')

  const nextState = structuredClone(state)
  nextState.trainingMode = 'word'

  rerender(
    <TypingContext.Provider value={{ state: nextState, dispatch }}>
      <SentencePanel />
    </TypingContext.Provider>,
  )

  expect(screen.getByRole('textbox', { name: 'sentence-token-input' })).toHaveValue('')
})

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
