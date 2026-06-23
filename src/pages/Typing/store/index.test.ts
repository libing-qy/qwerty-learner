import { TypingStateActionType, initialState, typingReducer } from './index'
import { produce } from 'immer'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/utils/db/review-record', () => ({}))

describe('typingReducer sentence mode transition', () => {
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
})
