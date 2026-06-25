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

  it('does not switch to sentence mode when no sentences are loaded', () => {
    const state = structuredClone(initialState)
    state.trainingMode = 'word'
    state.isTyping = false

    const nextState = produce(state, (draft) => {
      typingReducer(draft, { type: TypingStateActionType.SWITCH_TO_SENTENCE_MODE })
    })

    expect(nextState.trainingMode).toBe('word')
    expect(nextState.isTyping).toBe(false)
  })

  it('preserves the current sentence index when switching back to sentence mode', () => {
    const state = structuredClone(initialState)
    state.trainingMode = 'word'
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
    state.sentenceData.index = 1
    state.sentenceData.tokenIndex = 3
    state.sentenceData.inputToken = 'silent'

    const nextState = produce(state, (draft) => {
      typingReducer(draft, { type: TypingStateActionType.SWITCH_TO_SENTENCE_MODE })
    })

    expect(nextState.trainingMode).toBe('sentence-order')
    expect(nextState.sentenceData.index).toBe(1)
    expect(nextState.sentenceData.tokenIndex).toBe(0)
    expect(nextState.sentenceData.inputToken).toBe('')
  })

  it('resets sentence index to 0 when switching to sentence mode with an out-of-range index', () => {
    const state = structuredClone(initialState)
    state.trainingMode = 'word'
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
    state.sentenceData.index = 5
    state.sentenceData.tokenIndex = 2
    state.sentenceData.inputToken = 'plan'

    const nextState = produce(state, (draft) => {
      typingReducer(draft, { type: TypingStateActionType.SWITCH_TO_SENTENCE_MODE })
    })

    expect(nextState.sentenceData.index).toBe(0)
    expect(nextState.sentenceData.tokenIndex).toBe(0)
    expect(nextState.sentenceData.inputToken).toBe('')
  })

  it('switches from sentence mode back to word mode', () => {
    const state = structuredClone(initialState)
    state.trainingMode = 'sentence-order'
    state.isTyping = false
    state.isShowSkip = true
    state.chapterData.index = 3
    state.chapterData.wordCount = 8
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
    state.sentenceData.index = 0
    state.sentenceData.tokenIndex = 2
    state.sentenceData.inputToken = 'plan'

    const nextState = produce(state, (draft) => {
      typingReducer(draft, { type: TypingStateActionType.SWITCH_TO_WORD_MODE })
    })

    expect(nextState.trainingMode).toBe('word')
    expect(nextState.isTyping).toBe(true)
    expect(nextState.isShowSkip).toBe(false)
    expect(nextState.chapterData.index).toBe(3)
    expect(nextState.chapterData.wordCount).toBe(8)
  })

  it('does not switch modes after the chapter is finished', () => {
    const state = structuredClone(initialState)
    state.isFinished = true
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

    const switchedToWordState = produce(state, (draft) => {
      typingReducer(draft, { type: TypingStateActionType.SWITCH_TO_WORD_MODE })
    })

    expect(switchedToWordState.trainingMode).toBe('sentence-order')

    const switchedToSentenceState = produce(state, (draft) => {
      draft.trainingMode = 'word'
      typingReducer(draft, { type: TypingStateActionType.SWITCH_TO_SENTENCE_MODE })
    })

    expect(switchedToSentenceState.trainingMode).toBe('word')
  })

  it('jumps to a sentence index and resets reducer token state', () => {
    const state = structuredClone(initialState)
    state.trainingMode = 'sentence-order'
    state.isShowSkip = true
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
    state.sentenceData.index = 0
    state.sentenceData.tokenIndex = 2
    state.sentenceData.inputToken = 'wrong'

    const nextState = produce(state, (draft) => {
      typingReducer(draft, { type: TypingStateActionType.SKIP_2_SENTENCE_INDEX, newIndex: 1 })
    })

    expect(nextState.sentenceData.index).toBe(1)
    expect(nextState.sentenceData.tokenIndex).toBe(0)
    expect(nextState.sentenceData.inputToken).toBe('')
    expect(nextState.isShowSkip).toBe(false)
  })

  it('does not jump to another sentence after the chapter is finished', () => {
    const state = structuredClone(initialState)
    state.isFinished = true
    state.trainingMode = 'sentence-order'
    state.isShowSkip = true
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
    state.sentenceData.index = 0
    state.sentenceData.tokenIndex = 2
    state.sentenceData.inputToken = 'wrong'

    const nextState = produce(state, (draft) => {
      typingReducer(draft, { type: TypingStateActionType.SKIP_2_SENTENCE_INDEX, newIndex: 1 })
    })

    expect(nextState.sentenceData.index).toBe(0)
    expect(nextState.sentenceData.tokenIndex).toBe(2)
    expect(nextState.sentenceData.inputToken).toBe('wrong')
    expect(nextState.isShowSkip).toBe(true)
  })

  it('clears only sentenceData.inputToken when resetting the current token', () => {
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
    state.sentenceData.index = 0
    state.sentenceData.tokenIndex = 2
    state.sentenceData.inputToken = 'pla'

    const nextState = produce(state, (draft) => {
      typingReducer(draft, { type: TypingStateActionType.RESET_CURRENT_TOKEN })
    })

    expect(nextState.sentenceData.tokenIndex).toBe(2)
    expect(nextState.sentenceData.inputToken).toBe('')
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

  it('switches to sentence mode when the final word completion path dispatches NEXT_WORD', () => {
    const state = structuredClone(initialState)
    state.trainingMode = 'word'
    state.isTyping = true
    state.chapterData.words = [
      { name: 'cancel', trans: ['取消'], usphone: '', ukphone: '', index: 0 },
      { name: 'plan', trans: ['计划'], usphone: '', ukphone: '', index: 1 },
    ]
    state.chapterData.index = 1
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
      typingReducer(draft, { type: TypingStateActionType.NEXT_WORD })
    })

    expect(nextState.trainingMode).toBe('sentence-order')
    expect(nextState.isFinished).toBe(false)
    expect(nextState.chapterData.index).toBe(1)
    expect(nextState.chapterData.wordCount).toBe(1)
    expect(nextState.sentenceData.index).toBe(0)
    expect(nextState.sentenceData.tokenIndex).toBe(0)
  })
})
