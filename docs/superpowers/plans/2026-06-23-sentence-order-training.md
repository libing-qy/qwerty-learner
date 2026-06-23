# Sentence Order Training Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a chapter-end “连词成句” training stage that starts automatically after word practice, uses keyboard-only token input, and only marks a chapter complete after both word and sentence practice finish.

**Architecture:** Keep the existing [src/pages/Typing/index.tsx](src/pages/Typing/index.tsx) page shell, timer, chapter navigation, and result screen. Extend the existing typing reducer with a `trainingMode` branch and parallel `sentenceData`, then render a new `SentencePanel` when the chapter transitions from word practice to sentence-order practice. Load sentence resources separately from word dictionaries so chapters without sentence data keep their current behavior.

**Tech Stack:** React 18, TypeScript, Jotai, Vite, Playwright, Vitest (new), Testing Library (new)

---

## Pre-flight notes

- Work on branch `feat/sentence-order-training`.
- The current working tree already contains unrelated modifications in [docs/superpowers/specs/2026-06-22-project-structure-analysis-design.md](docs/superpowers/specs/2026-06-22-project-structure-analysis-design.md) and `yarn.lock`; do not include them in feature commits unless they are intentionally updated by this work.
- Keep all sentence resources additive so existing dictionaries still work unchanged.

### Task 1: Add focused test infrastructure for reducer and UI logic

**Files:**

- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/pages/Typing/store/index.test.ts`

- [ ] **Step 1: Write the failing test configuration and first reducer test**

Create [src/pages/Typing/store/index.test.ts](src/pages/Typing/store/index.test.ts) with this initial failing test:

```ts
import { initialState, typingReducer, TypingStateActionType } from './index'
import { describe, expect, it } from 'vitest'

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

    const nextState = typingReducer(state, { type: TypingStateActionType.SWITCH_TO_SENTENCE_MODE })

    expect(nextState.trainingMode).toBe('sentence-order')
    expect(nextState.isFinished).toBe(false)
    expect(nextState.sentenceData.index).toBe(0)
    expect(nextState.sentenceData.tokenIndex).toBe(0)
  })
})
```

Also add `vitest` scripts to [package.json](package.json):

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

Create [vitest.config.ts](vitest.config.ts):

```ts
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
```

Create [src/test/setup.ts](src/test/setup.ts):

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 2: Install test dependencies and run the test to verify it fails**

Run:

```bash
yarn add -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom
npm pkg get scripts.test scripts.test:watch
yarn vitest run src/pages/Typing/store/index.test.ts
```

Expected: `FAIL` because `trainingMode`, `sentenceData`, and `SWITCH_TO_SENTENCE_MODE` do not exist yet.

- [ ] **Step 3: Add the minimal typing store shape to satisfy compilation**

Update [src/pages/Typing/store/type.ts](src/pages/Typing/store/type.ts) with these additions:

```ts
import type { SentenceItem, SentenceInputLog, TrainingMode } from '@/typings'

export type SentenceData = {
  sentences: SentenceItem[]
  index: number
  tokenIndex: number
  inputToken: string
  sentenceCount: number
  correctCount: number
  wrongCount: number
  userInputLogs: SentenceInputLog[]
}

export type TypingState = {
  chapterData: ChapterData
  sentenceData: SentenceData
  timerData: TimerData
  trainingMode: TrainingMode
  isTyping: boolean
  isFinished: boolean
  isShowSkip: boolean
  isTransVisible: boolean
  isLoopSingleWord: boolean
  isSavingRecord: boolean
}
```

Update [src/pages/Typing/store/index.ts](src/pages/Typing/store/index.ts) with initial sentence state and enum member:

```ts
export const initialSentenceData: SentenceData = {
  sentences: [],
  index: 0,
  tokenIndex: 0,
  inputToken: '',
  sentenceCount: 0,
  correctCount: 0,
  wrongCount: 0,
  userInputLogs: [],
}

export const initialState: TypingState = {
  chapterData: {
    words: [],
    index: 0,
    wordCount: 0,
    correctCount: 0,
    wrongCount: 0,
    wordRecordIds: [],
    userInputLogs: [],
  },
  sentenceData: structuredClone(initialSentenceData),
  timerData: {
    time: 0,
    accuracy: 0,
    wpm: 0,
  },
  trainingMode: 'word',
  isTyping: false,
  isFinished: false,
  isShowSkip: false,
  isTransVisible: true,
  isLoopSingleWord: false,
  isSavingRecord: false,
}

export enum TypingStateActionType {
  SETUP_CHAPTER = 'SETUP_CHAPTER',
  SETUP_SENTENCES = 'SETUP_SENTENCES',
  SWITCH_TO_SENTENCE_MODE = 'SWITCH_TO_SENTENCE_MODE',
  SET_IS_SKIP = 'SET_IS_SKIP',
  SET_IS_TYPING = 'SET_IS_TYPING',
  TOGGLE_IS_TYPING = 'TOGGLE_IS_TYPING',
  REPORT_WRONG_WORD = 'REPORT_WRONG_WORD',
  REPORT_CORRECT_WORD = 'REPORT_CORRECT_WORD',
  REPORT_CORRECT_TOKEN = 'REPORT_CORRECT_TOKEN',
  REPORT_WRONG_TOKEN = 'REPORT_WRONG_TOKEN',
  NEXT_WORD = 'NEXT_WORD',
  LOOP_CURRENT_WORD = 'LOOP_CURRENT_WORD',
  FINISH_CHAPTER = 'FINISH_CHAPTER',
  INCREASE_WRONG_WORD = 'INCREASE_WRONG_WORD',
  SKIP_WORD = 'SKIP_WORD',
  SKIP_2_WORD_INDEX = 'SKIP_2_WORD_INDEX',
  REPEAT_CHAPTER = 'REPEAT_CHAPTER',
  NEXT_CHAPTER = 'NEXT_CHAPTER',
  TOGGLE_WORD_VISIBLE = 'TOGGLE_WORD_VISIBLE',
  TOGGLE_TRANS_VISIBLE = 'TOGGLE_TRANS_VISIBLE',
  TICK_TIMER = 'TICK_TIMER',
  ADD_WORD_RECORD_ID = 'ADD_WORD_RECORD_ID',
  SET_IS_SAVING_RECORD = 'SET_IS_SAVING_RECORD',
  SET_IS_LOOP_SINGLE_WORD = 'SET_IS_LOOP_SINGLE_WORD',
  TOGGLE_IS_LOOP_SINGLE_WORD = 'TOGGLE_IS_LOOP_SINGLE_WORD',
  SET_REVISION_INDEX = 'SET_REVISION_INDEX',
  NEXT_SENTENCE = 'NEXT_SENTENCE',
  RESET_CURRENT_TOKEN = 'RESET_CURRENT_TOKEN',
}
```

Add the first reducer branch:

```ts
case TypingStateActionType.SWITCH_TO_SENTENCE_MODE: {
  state.trainingMode = 'sentence-order'
  state.isTyping = true
  state.isShowSkip = false
  state.sentenceData.index = 0
  state.sentenceData.tokenIndex = 0
  state.sentenceData.inputToken = ''
  return state
}
```

- [ ] **Step 4: Run the reducer test to verify it passes**

Run:

```bash
yarn vitest run src/pages/Typing/store/index.test.ts
```

Expected: `PASS` for the first reducer test.

- [ ] **Step 5: Commit**

```bash
git add package.json yarn.lock vitest.config.ts src/test/setup.ts src/pages/Typing/store/type.ts src/pages/Typing/store/index.ts src/pages/Typing/store/index.test.ts
git commit -m "test: add typing reducer test harness"
```

### Task 2: Add sentence resource types and loader utilities

**Files:**

- Modify: `src/typings/index.ts`
- Create: `src/resources/sentences.ts`
- Create: `src/utils/sentenceListFetcher.ts`
- Create: `public/sentences/cet4.json`
- Create: `src/resources/sentences.test.ts`

- [ ] **Step 1: Write failing tests for sentence resource loading**

Create [src/resources/sentences.test.ts](src/resources/sentences.test.ts):

```ts
import { getSentenceResourceUrl, normalizeSentenceItems } from './sentences'
import { describe, expect, it } from 'vitest'

describe('sentence resources', () => {
  it('returns the expected resource url for a supported dictionary', () => {
    expect(getSentenceResourceUrl('cet4')).toBe('/sentences/cet4.json')
  })

  it('normalizes sentence items and filters invalid tokens', () => {
    const items = normalizeSentenceItems([
      {
        id: 'cet4-0-0',
        text: 'cancel the plan',
        tokens: ['cancel', 'the', 'plan'],
        trans: '取消计划',
        chapter: 0,
        sourceDictId: 'cet4',
      },
      {
        id: 'invalid',
        text: '',
        tokens: [],
        trans: 'bad',
        chapter: 0,
        sourceDictId: 'cet4',
      },
    ])

    expect(items).toHaveLength(1)
    expect(items[0]?.tokens).toEqual(['cancel', 'the', 'plan'])
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
yarn vitest run src/resources/sentences.test.ts
```

Expected: `FAIL` because the resource helpers do not exist yet.

- [ ] **Step 3: Implement sentence types, sample data, and resource helpers**

Add these types to [src/typings/index.ts](src/typings/index.ts):

```ts
export type TrainingMode = 'word' | 'sentence-order'

export type SentenceItem = {
  id: string
  text: string
  tokens: string[]
  trans: string
  chapter: number
  sourceDictId: string
}

export type SentenceInputLog = {
  index: number
  correctCount: number
  wrongCount: number
  wrongTokens: string[]
}
```

Create [src/resources/sentences.ts](src/resources/sentences.ts):

```ts
import type { SentenceItem } from '@/typings'

const sentenceResourceMap: Record<string, string> = {
  cet4: '/sentences/cet4.json',
}

export const getSentenceResourceUrl = (dictId: string) => sentenceResourceMap[dictId]

export const normalizeSentenceItems = (items: unknown): SentenceItem[] => {
  if (!Array.isArray(items)) return []

  return items.filter((item): item is SentenceItem => {
    if (!item || typeof item !== 'object') return false
    const sentence = item as SentenceItem
    return Boolean(
      sentence.id &&
        sentence.text &&
        typeof sentence.trans === 'string' &&
        typeof sentence.chapter === 'number' &&
        typeof sentence.sourceDictId === 'string' &&
        Array.isArray(sentence.tokens) &&
        sentence.tokens.length > 0 &&
        sentence.tokens.every((token) => typeof token === 'string' && token.trim().length > 0),
    )
  })
}
```

Create [src/utils/sentenceListFetcher.ts](src/utils/sentenceListFetcher.ts):

```ts
import { normalizeSentenceItems } from '@/resources/sentences'
import type { SentenceItem } from '@/typings'

export async function sentenceListFetcher(url: string): Promise<SentenceItem[]> {
  const response = await fetch(url)
  const data = await response.json()
  return normalizeSentenceItems(data)
}
```

Create [public/sentences/cet4.json](public/sentences/cet4.json):

```json
[
  {
    "id": "cet4-0-0",
    "text": "cancel the plan",
    "tokens": ["cancel", "the", "plan"],
    "trans": "取消计划",
    "chapter": 0,
    "sourceDictId": "cet4"
  },
  {
    "id": "cet4-0-1",
    "text": "the audience remained silent",
    "tokens": ["the", "audience", "remained", "silent"],
    "trans": "观众保持安静",
    "chapter": 0,
    "sourceDictId": "cet4"
  }
]
```

- [ ] **Step 4: Run the resource tests to verify they pass**

Run:

```bash
yarn vitest run src/resources/sentences.test.ts
```

Expected: `PASS`.

- [ ] **Step 5: Commit**

```bash
git add src/typings/index.ts src/resources/sentences.ts src/utils/sentenceListFetcher.ts public/sentences/cet4.json src/resources/sentences.test.ts
git commit -m "feat: add sentence training resources"
```

### Task 3: Load sentence lists alongside chapter words

**Files:**

- Modify: `src/pages/Typing/hooks/useWordList.ts`
- Create: `src/pages/Typing/hooks/useSentenceList.ts`
- Create: `src/pages/Typing/hooks/useSentenceList.test.ts`
- Modify: `src/pages/Typing/index.tsx`

- [ ] **Step 1: Write failing tests for sentence chapter filtering**

Create [src/pages/Typing/hooks/useSentenceList.test.ts](src/pages/Typing/hooks/useSentenceList.test.ts):

```ts
import { filterSentencesByChapter } from './useSentenceList'
import { describe, expect, it } from 'vitest'

describe('filterSentencesByChapter', () => {
  it('returns only current chapter sentences', () => {
    const sentences = [
      { id: 'a', text: 'cancel the plan', tokens: ['cancel', 'the', 'plan'], trans: '取消计划', chapter: 0, sourceDictId: 'cet4' },
      {
        id: 'b',
        text: 'remote work helps',
        tokens: ['remote', 'work', 'helps'],
        trans: '远程工作有帮助',
        chapter: 1,
        sourceDictId: 'cet4',
      },
    ]

    expect(filterSentencesByChapter(sentences, 0)).toHaveLength(1)
    expect(filterSentencesByChapter(sentences, 0)[0]?.id).toBe('a')
  })
})
```

- [ ] **Step 2: Run the hook test to verify it fails**

Run:

```bash
yarn vitest run src/pages/Typing/hooks/useSentenceList.test.ts
```

Expected: `FAIL` because `useSentenceList.ts` and `filterSentencesByChapter` do not exist.

- [ ] **Step 3: Implement sentence loading and Typing page setup**

Create [src/pages/Typing/hooks/useSentenceList.ts](src/pages/Typing/hooks/useSentenceList.ts):

```ts
import { getSentenceResourceUrl } from '@/resources/sentences'
import { currentChapterAtom, currentDictInfoAtom, reviewModeInfoAtom } from '@/store'
import type { SentenceItem } from '@/typings'
import { sentenceListFetcher } from '@/utils/sentenceListFetcher'
import { useAtomValue } from 'jotai'
import { useMemo } from 'react'
import useSWR from 'swr'

export const filterSentencesByChapter = (sentences: SentenceItem[], chapter: number) =>
  sentences.filter((sentence) => sentence.chapter === chapter)

export function useSentenceList() {
  const currentChapter = useAtomValue(currentChapterAtom)
  const currentDictInfo = useAtomValue(currentDictInfoAtom)
  const { isReviewMode } = useAtomValue(reviewModeInfoAtom)
  const resourceUrl = getSentenceResourceUrl(currentDictInfo.id)
  const { data = [], error, isLoading } = useSWR(resourceUrl ?? null, sentenceListFetcher)

  const sentences = useMemo(() => {
    if (isReviewMode) return []
    return filterSentencesByChapter(data, currentChapter)
  }, [currentChapter, data, isReviewMode])

  return { sentences, error, isLoading }
}
```

Update [src/pages/Typing/index.tsx](src/pages/Typing/index.tsx) to load sentences and initialize them:

```ts
import { useSentenceList } from './hooks/useSentenceList'

const { words } = useWordList()
const { sentences } = useSentenceList()

useEffect(() => {
  if (words !== undefined) {
    const initialIndex = isReviewMode && reviewModeInfo.reviewRecord?.index ? reviewModeInfo.reviewRecord.index : 0
    dispatch({
      type: TypingStateActionType.SETUP_CHAPTER,
      payload: { words, shouldShuffle: randomConfig.isOpen, initialIndex },
    })
  }
}, [words])

useEffect(() => {
  dispatch({
    type: TypingStateActionType.SETUP_SENTENCES,
    payload: { sentences },
  })
}, [dispatch, sentences])
```

Add the setup reducer branch in [src/pages/Typing/store/index.ts](src/pages/Typing/store/index.ts):

```ts
case TypingStateActionType.SETUP_SENTENCES: {
  state.sentenceData = {
    ...structuredClone(initialSentenceData),
    sentences: action.payload.sentences,
    userInputLogs: action.payload.sentences.map((_, index) => ({
      index,
      correctCount: 0,
      wrongCount: 0,
      wrongTokens: [],
    })),
  }
  return state
}
```

- [ ] **Step 4: Run the hook test to verify it passes**

Run:

```bash
yarn vitest run src/pages/Typing/hooks/useSentenceList.test.ts
```

Expected: `PASS`.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Typing/hooks/useSentenceList.ts src/pages/Typing/hooks/useSentenceList.test.ts src/pages/Typing/index.tsx src/pages/Typing/store/index.ts
git commit -m "feat: load chapter sentence lists"
```

### Task 4: Extend the reducer for sentence input, progression, and chapter completion

**Files:**

- Modify: `src/pages/Typing/store/index.ts`
- Modify: `src/pages/Typing/store/type.ts`
- Modify: `src/pages/Typing/store/index.test.ts`

- [ ] **Step 1: Write failing reducer tests for token progression and chapter finish**

Append these tests to [src/pages/Typing/store/index.test.ts](src/pages/Typing/store/index.test.ts):

```ts
it('advances token index after a correct token', () => {
  const state = structuredClone(initialState)
  state.trainingMode = 'sentence-order'
  state.sentenceData.sentences = [
    { id: 'cet4-0-0', text: 'cancel the plan', tokens: ['cancel', 'the', 'plan'], trans: '取消计划', chapter: 0, sourceDictId: 'cet4' },
  ]
  state.sentenceData.userInputLogs = [{ index: 0, correctCount: 0, wrongCount: 0, wrongTokens: [] }]

  const nextState = typingReducer(state, {
    type: TypingStateActionType.REPORT_CORRECT_TOKEN,
    payload: { token: 'cancel' },
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

  const afterToken = typingReducer(state, {
    type: TypingStateActionType.REPORT_CORRECT_TOKEN,
    payload: { token: 'cancel' },
  })

  const finishedState = typingReducer(afterToken, { type: TypingStateActionType.NEXT_SENTENCE })

  expect(finishedState.isFinished).toBe(true)
  expect(finishedState.isTyping).toBe(false)
})
```

- [ ] **Step 2: Run the reducer tests to verify they fail**

Run:

```bash
yarn vitest run src/pages/Typing/store/index.test.ts
```

Expected: `FAIL` because these actions do not update sentence progress yet.

- [ ] **Step 3: Implement sentence reducer branches**

Extend [src/pages/Typing/store/index.ts](src/pages/Typing/store/index.ts) action typings:

```ts
| { type: TypingStateActionType.SETUP_SENTENCES; payload: { sentences: SentenceItem[] } }
| { type: TypingStateActionType.REPORT_CORRECT_TOKEN; payload: { token: string } }
| { type: TypingStateActionType.REPORT_WRONG_TOKEN; payload: { token: string } }
| { type: TypingStateActionType.RESET_CURRENT_TOKEN }
| { type: TypingStateActionType.NEXT_SENTENCE }
```

Implement the reducer logic:

```ts
case TypingStateActionType.REPORT_CORRECT_TOKEN: {
  state.sentenceData.correctCount += 1
  state.sentenceData.inputToken = ''
  const log = state.sentenceData.userInputLogs[state.sentenceData.index]
  if (log) {
    log.correctCount += 1
  }
  state.sentenceData.tokenIndex += 1
  return state
}

case TypingStateActionType.REPORT_WRONG_TOKEN: {
  state.sentenceData.wrongCount += 1
  state.sentenceData.inputToken = ''
  const log = state.sentenceData.userInputLogs[state.sentenceData.index]
  if (log) {
    log.wrongCount += 1
    log.wrongTokens.push(action.payload.token)
  }
  return state
}

case TypingStateActionType.RESET_CURRENT_TOKEN: {
  state.sentenceData.inputToken = ''
  return state
}

case TypingStateActionType.NEXT_SENTENCE: {
  const isLastSentence = state.sentenceData.index >= state.sentenceData.sentences.length - 1
  if (isLastSentence) {
    state.isFinished = true
    state.isTyping = false
    state.isShowSkip = false
    return state
  }

  state.sentenceData.index += 1
  state.sentenceData.tokenIndex = 0
  state.sentenceData.inputToken = ''
  state.sentenceData.sentenceCount += 1
  state.isShowSkip = false
  return state
}
```

Add a helper for the current target token near the reducer tests or as an internal function if needed:

```ts
export const getCurrentSentenceToken = (state: TypingState) => {
  const sentence = state.sentenceData.sentences[state.sentenceData.index]
  return sentence?.tokens[state.sentenceData.tokenIndex] ?? ''
}
```

- [ ] **Step 4: Run the reducer tests to verify they pass**

Run:

```bash
yarn vitest run src/pages/Typing/store/index.test.ts
```

Expected: `PASS`.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Typing/store/index.ts src/pages/Typing/store/type.ts src/pages/Typing/store/index.test.ts
git commit -m "feat: add sentence training reducer flow"
```

### Task 5: Add sentence training UI and wire automatic mode switching

**Files:**

- Create: `src/pages/Typing/components/SentencePanel/index.tsx`
- Create: `src/pages/Typing/components/SentencePanel/components/SentenceInput.tsx`
- Create: `src/pages/Typing/components/SentencePanel/components/SentencePrompt.tsx`
- Create: `src/pages/Typing/components/SentencePanel/components/ScrambledTokens.tsx`
- Create: `src/pages/Typing/components/SentencePanel/index.test.tsx`
- Modify: `src/pages/Typing/components/WordPanel/index.tsx`
- Modify: `src/pages/Typing/index.tsx`
- Modify: `src/pages/Typing/store/index.ts`

- [ ] **Step 1: Write a failing component test for sentence rendering and token submit**

Create [src/pages/Typing/components/SentencePanel/index.test.tsx](src/pages/Typing/components/SentencePanel/index.test.tsx):

```tsx
import SentencePanel from './index'
import { TypingContext, initialState } from '@/pages/Typing/store'
import { fireEvent, render, screen } from '@testing-library/react'

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
```

- [ ] **Step 2: Run the component test to verify it fails**

Run:

```bash
yarn vitest run src/pages/Typing/components/SentencePanel/index.test.tsx
```

Expected: `FAIL` because `SentencePanel` and its children do not exist.

- [ ] **Step 3: Implement sentence UI and automatic transition from word mode**

Create [src/pages/Typing/components/SentencePanel/components/SentencePrompt.tsx](src/pages/Typing/components/SentencePanel/components/SentencePrompt.tsx):

```tsx
import { TypingContext } from '@/pages/Typing/store'
import { useContext } from 'react'

export default function SentencePrompt() {
  const { state } = useContext(TypingContext)!
  const sentence = state.sentenceData.sentences[state.sentenceData.index]

  return (
    <div className="mb-6 flex flex-col items-center gap-3">
      <p className="text-base text-gray-500 dark:text-gray-300">连词成句</p>
      <p className="text-2xl font-semibold text-gray-900 dark:text-white">{sentence?.trans}</p>
      <p className="text-sm text-gray-400">
        第 {state.sentenceData.index + 1} / {state.sentenceData.sentences.length} 句
      </p>
    </div>
  )
}
```

Create [src/pages/Typing/components/SentencePanel/components/ScrambledTokens.tsx](src/pages/Typing/components/SentencePanel/components/ScrambledTokens.tsx):

```tsx
import shuffle from '@/utils/shuffle'
import { useMemo } from 'react'

export default function ScrambledTokens({ tokens }: { tokens: string[] }) {
  const scrambled = useMemo(() => shuffle(tokens.map((token) => ({ token }))).map((item) => item.token), [tokens])

  return (
    <div className="mb-6 flex flex-wrap justify-center gap-2">
      {scrambled.map((token, index) => (
        <span
          key={`${token}-${index}`}
          className="rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-700 dark:bg-gray-700 dark:text-indigo-200"
        >
          {token}
        </span>
      ))}
    </div>
  )
}
```

Create [src/pages/Typing/components/SentencePanel/components/SentenceInput.tsx](src/pages/Typing/components/SentencePanel/components/SentenceInput.tsx):

```tsx
import { TypingContext, TypingStateActionType } from '@/pages/Typing/store'
import { useContext, useMemo, useState } from 'react'

export default function SentenceInput() {
  const { state, dispatch } = useContext(TypingContext)!
  const [value, setValue] = useState('')
  const sentence = state.sentenceData.sentences[state.sentenceData.index]
  const targetToken = sentence?.tokens[state.sentenceData.tokenIndex] ?? ''
  const completedTokens = useMemo(
    () => sentence?.tokens.slice(0, state.sentenceData.tokenIndex) ?? [],
    [sentence, state.sentenceData.tokenIndex],
  )

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-2 text-lg text-gray-700 dark:text-gray-200">
        {completedTokens.map((token, index) => (
          <span key={`${token}-${index}`} className="rounded bg-green-100 px-2 py-1 dark:bg-green-900">
            {token}
          </span>
        ))}
      </div>
      <input
        aria-label="sentence-token-input"
        autoFocus
        className="w-full rounded-xl border border-indigo-300 px-4 py-3 text-center text-xl outline-none focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== ' ') return
          e.preventDefault()
          const token = value.trim()
          if (!token) return
          if (token.toLowerCase() === targetToken.toLowerCase()) {
            dispatch({ type: TypingStateActionType.REPORT_CORRECT_TOKEN, payload: { token } })
            const isLastToken = state.sentenceData.tokenIndex >= (sentence?.tokens.length ?? 1) - 1
            if (isLastToken) {
              dispatch({ type: TypingStateActionType.NEXT_SENTENCE })
            }
          } else {
            dispatch({ type: TypingStateActionType.REPORT_WRONG_TOKEN, payload: { token } })
          }
          setValue('')
        }}
      />
    </div>
  )
}
```

Create [src/pages/Typing/components/SentencePanel/index.tsx](src/pages/Typing/components/SentencePanel/index.tsx):

```tsx
import ScrambledTokens from './components/ScrambledTokens'
import SentenceInput from './components/SentenceInput'
import SentencePrompt from './components/SentencePrompt'
import { TypingContext } from '@/pages/Typing/store'
import { useContext } from 'react'

export default function SentencePanel() {
  const { state } = useContext(TypingContext)!
  const sentence = state.sentenceData.sentences[state.sentenceData.index]

  if (!sentence) return null

  return (
    <div className="container flex h-full w-full flex-col items-center justify-center">
      <SentencePrompt />
      <ScrambledTokens tokens={sentence.tokens} />
      <SentenceInput />
    </div>
  )
}
```

Update [src/pages/Typing/components/WordPanel/index.tsx](src/pages/Typing/components/WordPanel/index.tsx) to switch by `trainingMode`:

```tsx
import SentencePanel from '../SentencePanel'

if (state.trainingMode === 'sentence-order') {
  return (
    <div className="container flex h-full w-full flex-col items-center justify-center">
      <SentencePanel />
      <Progress className={`mb-10 mt-auto ${state.isTyping ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  )
}
```

Update the `onFinish` callback in [src/pages/Typing/components/WordPanel/index.tsx](src/pages/Typing/components/WordPanel/index.tsx) so the last word transitions to sentence mode when sentence data exists:

```tsx
const hasSentenceTraining = state.sentenceData.sentences.length > 0

const onFinish = useCallback(() => {
  if (state.chapterData.index < state.chapterData.words.length - 1 || currentWordExerciseCount < loopWordTimes - 1) {
    // existing logic unchanged
    return
  }

  if (hasSentenceTraining) {
    dispatch({ type: TypingStateActionType.SWITCH_TO_SENTENCE_MODE })
    return
  }

  dispatch({ type: TypingStateActionType.FINISH_CHAPTER })
  if (isReviewMode) {
    setReviewModeInfo((old) => ({ ...old, reviewRecord: old.reviewRecord ? { ...old.reviewRecord, isFinished: true } : undefined }))
  }
}, [
  currentWordExerciseCount,
  dispatch,
  hasSentenceTraining,
  isReviewMode,
  loopWordTimes,
  setReviewModeInfo,
  state.chapterData.index,
  state.chapterData.words.length,
])
```

- [ ] **Step 4: Run the component tests to verify they pass**

Run:

```bash
yarn vitest run src/pages/Typing/components/SentencePanel/index.test.tsx
```

Expected: `PASS`.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Typing/components/SentencePanel src/pages/Typing/components/WordPanel/index.tsx src/pages/Typing/index.tsx src/pages/Typing/store/index.ts
git commit -m "feat: add sentence training interface"
```

### Task 6: Add result summary, skip behavior, and end-to-end verification

**Files:**

- Modify: `src/pages/Typing/components/ResultScreen/index.tsx`
- Modify: `src/pages/Typing/index.tsx`
- Modify: `src/pages/Typing/store/index.ts`
- Modify: `tests/e2e/practice.spec.ts`

- [ ] **Step 1: Write a failing e2e test for automatic sentence-stage entry**

Append this test to [tests/e2e/practice.spec.ts](tests/e2e/practice.spec.ts):

```ts
test('Complete chapter words and automatically enter sentence order training', async ({ page }) => {
  await page.keyboard.press('Enter')

  const chapter1 = [
    'cancel',
    'explosive',
    'numerous',
    'govern',
    'analyse',
    'discourage',
    'resemble',
    'remote',
    'salary',
    'pollution',
    'pretend',
    'kettle',
    'wreck',
    'drunk',
    'calculate',
    'persistent',
    'sake',
    'conceal',
    'audience',
    'meanwhile',
  ]

  await pressWords(page, chapter1)

  await expect(page.getByText('连词成句')).toBeVisible()
  await expect(page.getByText('取消计划')).toBeVisible()

  await pressWord(page, 'cancel')
  await page.keyboard.press('Space')
  await pressWord(page, 'the')
  await page.keyboard.press('Space')
  await pressWord(page, 'plan')
  await page.keyboard.press('Space')

  await expect(page.getByText('观众保持安静')).toBeVisible()
})
```

- [ ] **Step 2: Run the e2e test to verify it fails**

Run:

```bash
yarn test:e2e tests/e2e/practice.spec.ts --grep "automatically enter sentence order training"
```

Expected: `FAIL` because the result screen still appears immediately and sentence training summary is missing.

- [ ] **Step 3: Implement result summary and sentence skip/finish behavior**

Update sentence skip behavior in [src/pages/Typing/index.tsx](src/pages/Typing/index.tsx):

```ts
const skipWord = useCallback(() => {
  if (state.trainingMode === 'sentence-order') {
    dispatch({ type: TypingStateActionType.NEXT_SENTENCE })
    return
  }
  dispatch({ type: TypingStateActionType.SKIP_WORD })
}, [dispatch, state.trainingMode])
```

Update the reducer so sentence mode can show skip after repeated errors:

```ts
case TypingStateActionType.REPORT_WRONG_TOKEN: {
  state.sentenceData.wrongCount += 1
  state.sentenceData.inputToken = ''
  const log = state.sentenceData.userInputLogs[state.sentenceData.index]
  if (log) {
    log.wrongCount += 1
    log.wrongTokens.push(action.payload.token)
    if (log.wrongCount >= 3) {
      state.isShowSkip = true
    }
  }
  return state
}
```

Update [src/pages/Typing/components/ResultScreen/index.tsx](src/pages/Typing/components/ResultScreen/index.tsx) to show sentence summary when present:

```tsx
const sentenceAccuracy = useMemo(() => {
  const totalInputs = state.sentenceData.correctCount + state.sentenceData.wrongCount
  if (totalInputs === 0) return 100
  return Math.floor((state.sentenceData.correctCount / totalInputs) * 100)
}, [state.sentenceData.correctCount, state.sentenceData.wrongCount])

const hasSentenceTraining = state.sentenceData.sentences.length > 0
```

Add this block below the existing ring summary area:

```tsx
{
  hasSentenceTraining && (
    <div className="mt-6 rounded-xl bg-indigo-50 px-6 py-4 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-100">
      <h3 className="mb-2 text-base font-semibold">连词成句训练</h3>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>句子总数：{state.sentenceData.sentences.length}</div>
        <div>完成句数：{state.sentenceData.sentenceCount}</div>
        <div>正确 token：{state.sentenceData.correctCount}</div>
        <div>正确率：{sentenceAccuracy}%</div>
      </div>
    </div>
  )
}
```

If `sentenceCount` should include the last sentence immediately, increment it in the final `NEXT_SENTENCE` branch before setting `isFinished = true`:

```ts
if (isLastSentence) {
  state.sentenceData.sentenceCount += 1
  state.isFinished = true
  state.isTyping = false
  state.isShowSkip = false
  return state
}
```

- [ ] **Step 4: Run verification to confirm the full flow passes**

Run:

```bash
yarn vitest run src/pages/Typing/store/index.test.ts src/resources/sentences.test.ts src/pages/Typing/hooks/useSentenceList.test.ts src/pages/Typing/components/SentencePanel/index.test.tsx
yarn test:e2e tests/e2e/practice.spec.ts --grep "Practice|automatically enter sentence order training"
yarn lint
```

Expected:

- Vitest: all targeted tests `PASS`
- Playwright: updated practice flow `PASS`
- ESLint: no new errors

- [ ] **Step 5: Commit**

```bash
git add src/pages/Typing/components/ResultScreen/index.tsx src/pages/Typing/index.tsx src/pages/Typing/store/index.ts tests/e2e/practice.spec.ts
git commit -m "feat: finish sentence order chapter flow"
```
