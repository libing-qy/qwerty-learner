import { TypingStateActionType, initialState, typingReducer } from './index'
import { produce } from 'immer'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/utils/db/review-record', () => ({}))

describe('typingReducer sentence mode transition', () => {
  it('preserves loaded sentences when chapter setup resets word state', () => {
    const state = structuredClone(initialState)
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

    const nextState = produce(state, (draft) => {
      return typingReducer(draft, {
        type: TypingStateActionType.SETUP_CHAPTER,
        payload: {
          words: [{ name: 'cancel', trans: ['取消'], usphone: '', ukphone: '', index: 0 }],
          shouldShuffle: false,
        },
      })
    })

    expect(nextState.sentenceData.sentences).toHaveLength(1)
    expect(nextState.sentenceData.userInputLogs).toHaveLength(1)
  })

  it('switches to sentence mode when word stage finishes and sentences exist', () => {
    const state = structuredClone(initialState)
    state.trainingMode = 'word'
    state.chapterData.words = [{ name: 'cancel', trans: ['取消'], usphone: '', ukphone: '', index: 0 }]
    state.chapterData.index = 0
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

    const nextState = produce(state, (draft) => {
      typingReducer(draft, { type: TypingStateActionType.SWITCH_TO_SENTENCE_MODE })
    })

    expect(nextState.trainingMode).toBe('sentence-order')
    expect(nextState.isFinished).toBe(false)
    expect(nextState.sentenceData.index).toBe(0)
    expect(nextState.sentenceData.tokenIndex).toBe(0)
  })

  it('advances token index after a correct token', () => {
    const state = structuredClone(initialState)
    state.trainingMode = 'sentence-order'
    state.sentenceData.sentences = [
      { id: 'cet4-0-0', text: 'cancel the plan', tokens: ['cancel', 'the', 'plan'], trans: '取消计划', chapter: 0, sourceDictId: 'cet4' },
    ]
    state.sentenceData.userInputLogs = [{ index: 0, correctCount: 0, wrongCount: 0, wrongTokens: [] }]

    const nextState = produce(state, (draft) => {
      typingReducer(draft, {
        type: TypingStateActionType.REPORT_CORRECT_TOKEN,
        payload: { token: 'cancel' },
      })
    })

    expect(nextState.sentenceData.tokenIndex).toBe(1)
    expect(nextState.sentenceData.inputToken).toBe('')
    expect(nextState.sentenceData.correctCount).toBe(1)
  })

  it('marks chapter finished after the last sentence token', () => {
    const state = structuredClone(initialState)
    state.trainingMode = 'sentence-order'
    state.sentenceData.sentences = [{ id: 'cet4-0-0', text: 'cancel', tokens: ['cancel'], trans: '取消', chapter: 0, sourceDictId: 'cet4' }]
    state.sentenceData.userInputLogs = [{ index: 0, correctCount: 0, wrongCount: 0, wrongTokens: [] }]

    const afterToken = produce(state, (draft) => {
      typingReducer(draft, {
        type: TypingStateActionType.REPORT_CORRECT_TOKEN,
        payload: { token: 'cancel' },
      })
    })

    const finishedState = produce(afterToken, (draft) => {
      typingReducer(draft, { type: TypingStateActionType.NEXT_SENTENCE })
    })

    expect(finishedState.isFinished).toBe(true)
    expect(finishedState.isTyping).toBe(false)
  })

  it('switches to sentence mode when skipping the final word of a sentence-enabled chapter', () => {
    const state = structuredClone(initialState)
    state.trainingMode = 'word'
    state.chapterData.words = [{ name: 'cancel', trans: ['取消'], usphone: '', ukphone: '', index: 0 }]
    state.chapterData.index = 0
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

    const nextState = produce(state, (draft) => {
      typingReducer(draft, { type: TypingStateActionType.SKIP_WORD })
    })

    expect(nextState.trainingMode).toBe('sentence-order')
    expect(nextState.isFinished).toBe(false)
  })
})
