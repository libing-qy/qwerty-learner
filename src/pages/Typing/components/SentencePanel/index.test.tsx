import SentencePanel from './index'
import * as keySoundsModule from '@/hooks/useKeySounds'
import * as sentencePronunciationModule from '@/pages/Typing/hooks/useSentencePronunciation'
import { TypingContext, initialState } from '@/pages/Typing/store'
import { fontSizeConfigAtom, wordDictationConfigAtom } from '@/store'
import * as shuffleModule from '@/utils/shuffle'
import { fireEvent, render, screen } from '@testing-library/react'
import { Provider, createStore, getDefaultStore } from 'jotai'
import { beforeEach, vi } from 'vitest'

const playKeySound = vi.fn()
const playWrongSound = vi.fn()
const playCorrectSound = vi.fn()
const replaySentencePronunciation = vi.fn()
const stopSentencePronunciation = vi.fn()

vi.spyOn(keySoundsModule, 'default').mockReturnValue([playKeySound, playWrongSound, playCorrectSound])
const shuffleSpy = vi.spyOn(shuffleModule, 'default')
const useSentencePronunciationSpy = vi.spyOn(sentencePronunciationModule, 'default')

beforeEach(() => {
  vi.clearAllMocks()
  getDefaultStore().set(wordDictationConfigAtom, {
    isOpen: false,
    type: 'hideAll',
    openBy: 'auto',
  })
  shuffleSpy.mockImplementation((array) => [...array].reverse())
  useSentencePronunciationSpy.mockReturnValue({
    replay: replaySentencePronunciation,
    stop: stopSentencePronunciation,
    isPlaying: false,
  })
})

it('wires the current sentence into pronunciation auto-play and replay controls', () => {
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

  expect(useSentencePronunciationSpy).toHaveBeenCalledWith({
    sentenceId: 'cet4-0-0',
    text: 'cancel the plan',
    autoPlay: true,
  })

  fireEvent.click(screen.getByRole('button'))

  expect(replaySentencePronunciation).toHaveBeenCalledTimes(1)
})

it('updates pronunciation wiring when the active sentence changes', () => {
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

  const nextState = structuredClone(state)
  nextState.sentenceData.index = 1

  rerender(
    <TypingContext.Provider value={{ state: nextState, dispatch }}>
      <SentencePanel />
    </TypingContext.Provider>,
  )

  expect(useSentencePronunciationSpy).toHaveBeenLastCalledWith({
    sentenceId: 'cet4-0-1',
    text: 'the audience remained silent',
    autoPlay: true,
  })
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
  expect(container.querySelector('.rounded-full')).toHaveStyle({ fontSize: '28px' })

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

it('hides scrambled token prompts when dictation mode is enabled', () => {
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
  const store = createStore()
  store.set(wordDictationConfigAtom, {
    isOpen: true,
    type: 'hideAll',
    openBy: 'user',
  })

  render(
    <Provider store={store}>
      <TypingContext.Provider value={{ state, dispatch }}>
        <SentencePanel />
      </TypingContext.Provider>
    </Provider>,
  )

  expect(screen.getByText('取消计划')).toBeInTheDocument()
  expect(screen.queryByText('plan')).not.toBeInTheDocument()
})

it('hides sentence translation when translation display is disabled', () => {
  const state = structuredClone(initialState)
  state.trainingMode = 'sentence-order'
  state.isTyping = true
  state.isTransVisible = false
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

  expect(screen.queryByText('取消计划')).not.toBeInTheDocument()
})

it('uses sentence font size and monospace styling for prompt tokens and sentence input text', () => {
  const state = structuredClone(initialState)
  state.trainingMode = 'sentence-order'
  state.isTyping = true
  state.sentenceData.index = 0
  state.sentenceData.tokenIndex = 1
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
  state.sentenceData.userInputLogs = [{ index: 0, correctCount: 1, wrongCount: 0, wrongTokens: [] }]

  const dispatch = vi.fn()
  const store = createStore()
  store.set(fontSizeConfigAtom, {
    foreignFont: 22,
    sentenceForeignFont: 34,
    translateFont: 16,
  })

  render(
    <Provider store={store}>
      <TypingContext.Provider value={{ state, dispatch }}>
        <SentencePanel />
      </TypingContext.Provider>
    </Provider>,
  )

  expect(screen.getByText('取消计划')).toHaveStyle({ fontSize: '16px' })
  expect(screen.getByText('plan')).toHaveStyle({
    fontSize: '34px',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  })
  expect(screen.getAllByText('cancel').at(-1)).toHaveStyle({ fontSize: '34px' })
  expect(screen.getByRole('textbox', { name: 'sentence-token-input' })).toHaveStyle({ fontSize: '34px' })
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
