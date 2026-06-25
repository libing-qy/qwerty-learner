import SentencePanel from './index'
import * as keySoundsModule from '@/hooks/useKeySounds'
import { TypingContext, initialState } from '@/pages/Typing/store'
import * as shuffleModule from '@/utils/shuffle'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, vi } from 'vitest'

const playKeySound = vi.fn()
const playWrongSound = vi.fn()
const playCorrectSound = vi.fn()

vi.spyOn(keySoundsModule, 'default').mockReturnValue([playKeySound, playWrongSound, playCorrectSound])
const shuffleSpy = vi.spyOn(shuffleModule, 'default')

beforeEach(() => {
  vi.clearAllMocks()
  shuffleSpy.mockImplementation((array) => [...array].reverse())
})

it('uses a larger token font and reshuffles prompts only when practicing a new sentence', () => {
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

  const { rerender, container } = render(
    <TypingContext.Provider value={{ state, dispatch }}>
      <SentencePanel />
    </TypingContext.Provider>,
  )

  expect(shuffleSpy).toHaveBeenCalledTimes(1)
  const firstTokens = Array.from(container.querySelectorAll('.rounded-full')).map((node) => node.textContent)
  expect(firstTokens).toEqual(['plan', 'the', 'cancel'])
  expect(container.querySelector('.rounded-full')).toHaveClass('text-lg')

  const sameSentenceState = structuredClone(state)
  sameSentenceState.sentenceData.tokenIndex = 1
  rerender(
    <TypingContext.Provider value={{ state: sameSentenceState, dispatch }}>
      <SentencePanel />
    </TypingContext.Provider>,
  )

  expect(shuffleSpy).toHaveBeenCalledTimes(1)

  const nextSentenceState = structuredClone(state)
  nextSentenceState.sentenceData.index = 1
  rerender(
    <TypingContext.Provider value={{ state: nextSentenceState, dispatch }}>
      <SentencePanel />
    </TypingContext.Provider>,
  )

  expect(shuffleSpy).toHaveBeenCalledTimes(2)
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

  const { rerender } = render(
    <TypingContext.Provider value={{ state, dispatch }}>
      <SentencePanel />
    </TypingContext.Provider>,
  )

  expect(screen.getByText('取消计划')).toBeInTheDocument()
  expect(screen.getByText('plan')).toBeInTheDocument()

  const input = screen.getByRole('textbox', { name: 'sentence-token-input' })
  expect(input).toHaveClass('text-2xl')
  fireEvent.change(input, { target: { value: 'cancel' } })
  fireEvent.keyDown(input, { key: ' ', code: 'Space' })

  expect(dispatch).toHaveBeenCalled()

  const nextState = structuredClone(state)
  nextState.sentenceData.tokenIndex = 1
  rerender(
    <TypingContext.Provider value={{ state: nextState, dispatch }}>
      <SentencePanel />
    </TypingContext.Provider>,
  )

  expect(screen.getAllByText('cancel').at(-1)).toHaveClass('text-xl')
})

it('submits the current token with Enter and moves to the next sentence after the last token', () => {
  const state = structuredClone(initialState)
  state.trainingMode = 'sentence-order'
  state.isTyping = true
  state.sentenceData.sentences = [
    {
      id: 'cet4-0-0',
      text: 'cancel',
      tokens: ['cancel'],
      trans: '取消',
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
  fireEvent.change(input, { target: { value: 'cancel' } })
  fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

  expect(dispatch).toHaveBeenCalledWith({
    type: 'REPORT_CORRECT_TOKEN',
    payload: { token: 'cancel' },
  })
  expect(dispatch).toHaveBeenCalledWith({ type: 'NEXT_SENTENCE' })
})
