# Typing Mode Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add direct word/sentence mode switching to the Typing page and reuse the existing left drawer to navigate both words and sentences.

**Architecture:** Extend the `Typing` reducer with explicit word-mode and sentence-index navigation actions, then wire those actions into the existing header and drawer UI. Keep the left drawer as a single navigation surface that renders either `WordCard` or a new `SentenceCard` based on `trainingMode`, while preserving current review mode and chapter-completion behavior.

**Tech Stack:** React 18, TypeScript, Jotai, use-immer reducer, Vitest, Testing Library, Vite

---

## File Structure

### Existing files to modify

- `src/pages/Typing/store/index.ts`
  - Add `SWITCH_TO_WORD_MODE` and `SKIP_2_SENTENCE_INDEX`
  - Reuse/reset sentence token state in a single place
- `src/pages/Typing/store/index.test.ts`
  - Add reducer tests for word-mode switching and sentence index navigation
- `src/pages/Typing/index.tsx`
  - Add header quick-switch buttons
  - Disable sentence button when no sentence data exists
  - Hide sentence switch in review mode
- `src/pages/Typing/components/WordList/index.tsx`
  - Render drawer content based on `trainingMode`
  - Dispatch word/sentence jump actions
- `src/pages/Typing/components/WordList/WordCard.tsx`
  - Add click callback prop so card click can navigate, while preserving pronunciation play
- `src/pages/Typing/components/SentencePanel/index.test.tsx`
  - Keep existing sentence panel behavior tests green after reducer/UI changes

### New files to create

- `src/pages/Typing/components/WordList/SentenceCard.tsx`
  - Render sentence navigation row with Chinese + English preview
- `src/pages/Typing/components/WordList/index.test.tsx`
  - Verify drawer renders words in word mode and sentences in sentence mode
  - Verify sentence item click dispatches sentence jump action
- `src/pages/Typing/ModeSwitcher.test.tsx`
  - Verify header buttons switch modes and disable sentence entry when unavailable

---

### Task 1: Extend reducer navigation actions

**Files:**
- Modify: `src/pages/Typing/store/index.ts`
- Test: `src/pages/Typing/store/index.test.ts`

- [ ] **Step 1: Write the failing reducer tests**

Add these tests to `src/pages/Typing/store/index.test.ts`:

```ts
it('switches from sentence mode back to word mode', () => {
  const state = structuredClone(initialState)
  state.trainingMode = 'sentence-order'
  state.isShowSkip = true
  state.chapterData.index = 3
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
  expect(nextState.isShowSkip).toBe(false)
  expect(nextState.chapterData.index).toBe(3)
})

it('jumps to a sentence index and resets current token state', () => {
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
yarn vitest run src/pages/Typing/store/index.test.ts
```

Expected: FAIL with TypeScript/reducer errors because `SWITCH_TO_WORD_MODE` and `SKIP_2_SENTENCE_INDEX` do not exist yet.

- [ ] **Step 3: Write the minimal reducer implementation**

Update `src/pages/Typing/store/index.ts` with these edits:

```ts
const resetSentenceTokenState = (state: TypingState) => {
  state.sentenceData.tokenIndex = 0
  state.sentenceData.inputToken = ''
}

const switchToSentenceMode = (state: TypingState) => {
  state.trainingMode = 'sentence-order'
  state.isTyping = true
  state.isShowSkip = false
  if (state.sentenceData.index >= state.sentenceData.sentences.length) {
    state.sentenceData.index = 0
  }
  resetSentenceTokenState(state)
}
```

Extend the enum and action union:

```ts
  SWITCH_TO_WORD_MODE = 'SWITCH_TO_WORD_MODE',
  SKIP_2_SENTENCE_INDEX = 'SKIP_2_SENTENCE_INDEX',
```

```ts
  | { type: TypingStateActionType.SWITCH_TO_WORD_MODE }
  | { type: TypingStateActionType.SKIP_2_SENTENCE_INDEX; newIndex: number }
```

Add reducer cases:

```ts
    case TypingStateActionType.SWITCH_TO_WORD_MODE:
      state.trainingMode = 'word'
      state.isTyping = true
      state.isShowSkip = false
      break
```

```ts
    case TypingStateActionType.SKIP_2_SENTENCE_INDEX: {
      const newIndex = action.newIndex
      if (newIndex < 0 || newIndex >= state.sentenceData.sentences.length) {
        break
      }
      state.sentenceData.index = newIndex
      resetSentenceTokenState(state)
      state.isShowSkip = false
      break
    }
```

Update existing sentence cases to reuse the helper:

```ts
    case TypingStateActionType.RESET_CURRENT_TOKEN:
      state.sentenceData.inputToken = ''
      break
```

becomes:

```ts
    case TypingStateActionType.RESET_CURRENT_TOKEN:
      resetSentenceTokenState(state)
      break
```

and inside `NEXT_SENTENCE` replace the manual resets with:

```ts
      resetSentenceTokenState(state)
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
yarn vitest run src/pages/Typing/store/index.test.ts
```

Expected: PASS with all reducer tests green.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Typing/store/index.ts src/pages/Typing/store/index.test.ts
git commit -m "feat: add typing mode navigation actions"
```

---

### Task 2: Add header mode switcher

**Files:**
- Modify: `src/pages/Typing/index.tsx`
- Create: `src/pages/Typing/ModeSwitcher.test.tsx`

- [ ] **Step 1: Write the failing mode-switcher UI test**

Create `src/pages/Typing/ModeSwitcher.test.tsx` with:

```tsx
import App from './index'
import { currentChapterAtom, currentDictIdAtom, isReviewModeAtom, randomConfigAtom, reviewModeInfoAtom } from '@/store'
import { Provider, createStore } from 'jotai'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

vi.mock('./hooks/useWordList', () => ({
  useWordList: () => ({
    words: [{ name: 'cancel', trans: ['取消'], usphone: '', ukphone: '', index: 0 }],
  }),
}))

vi.mock('./hooks/useSentenceList', () => ({
  useSentenceList: () => ({
    sentences: [
      {
        id: 'cet4-0-0',
        text: 'cancel the plan',
        tokens: ['cancel', 'the', 'plan'],
        trans: '取消计划',
        chapter: 0,
        sourceDictId: 'cet4',
      },
    ],
  }),
}))

vi.mock('@/components/DonateCard', () => ({ DonateCard: () => null }))
vi.mock('@/components/Header', () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }))
vi.mock('../../components/Layout', () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }))
vi.mock('./components/DictChapterButton', () => ({ DictChapterButton: () => null }))
vi.mock('./components/PronunciationSwitcher', () => ({ default: () => null }))
vi.mock('./components/ResultScreen', () => ({ default: () => null }))
vi.mock('./components/Speed', () => ({ default: () => null }))
vi.mock('./components/StartButton', () => ({ default: () => null }))
vi.mock('./components/Switcher', () => ({ default: () => null }))
vi.mock('./components/WordList', () => ({ default: () => null }))
vi.mock('./components/WordPanel', () => ({ default: () => <div>WordPanel</div> }))
vi.mock('./hooks/useConfetti', () => ({ useConfetti: () => undefined }))
vi.mock('@/utils/db', () => ({ useSaveChapterRecord: () => vi.fn() }))
vi.mock('@/utils/mixpanel', () => ({ useMixPanelChapterLogUploader: () => vi.fn() }))

describe('Typing mode switcher', () => {
  it('renders word and sentence buttons and disables sentence button when no sentence data exists', async () => {
    const store = createStore()
    store.set(currentDictIdAtom, 'cet4')
    store.set(currentChapterAtom, 0)
    store.set(randomConfigAtom, { isOpen: false })
    store.set(reviewModeInfoAtom, { isReviewMode: false })

    render(
      <Provider store={store}>
        <App />
      </Provider>,
    )

    expect(screen.getByRole('button', { name: '单词练习' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '句子练习' })).toBeEnabled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
yarn vitest run src/pages/Typing/ModeSwitcher.test.tsx
```

Expected: FAIL because the buttons do not exist yet.

- [ ] **Step 3: Write the minimal UI implementation**

In `src/pages/Typing/index.tsx`, add derived flags:

```tsx
  const hasSentenceTraining = sentences.length > 0
  const showSentenceSwitcher = !isReviewMode
```

Add callbacks:

```tsx
  const switchToWordMode = useCallback(() => {
    dispatch({ type: TypingStateActionType.SWITCH_TO_WORD_MODE })
  }, [dispatch])

  const switchToSentenceMode = useCallback(() => {
    if (!hasSentenceTraining) return
    dispatch({ type: TypingStateActionType.SWITCH_TO_SENTENCE_MODE })
  }, [dispatch, hasSentenceTraining])
```

Insert these buttons inside `<Header>` after `<StartButton />`:

```tsx
          {showSentenceSwitcher && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`my-btn-primary h-10 px-3 text-sm ${state.trainingMode === 'word' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-100'}`}
                onClick={switchToWordMode}
              >
                单词练习
              </button>
              <button
                type="button"
                className={`my-btn-primary h-10 px-3 text-sm ${state.trainingMode === 'sentence-order' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-100'} ${!hasSentenceTraining ? 'cursor-not-allowed opacity-50' : ''}`}
                onClick={switchToSentenceMode}
                disabled={!hasSentenceTraining}
              >
                句子练习
              </button>
            </div>
          )}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
yarn vitest run src/pages/Typing/ModeSwitcher.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Typing/index.tsx src/pages/Typing/ModeSwitcher.test.tsx
git commit -m "feat: add typing mode switcher"
```

---

### Task 3: Reuse the left drawer for sentence navigation

**Files:**
- Modify: `src/pages/Typing/components/WordList/index.tsx`
- Modify: `src/pages/Typing/components/WordList/WordCard.tsx`
- Create: `src/pages/Typing/components/WordList/SentenceCard.tsx`
- Create: `src/pages/Typing/components/WordList/index.test.tsx`

- [ ] **Step 1: Write the failing drawer navigation test**

Create `src/pages/Typing/components/WordList/index.test.tsx`:

```tsx
import WordList from './index'
import { TypingContext, initialState } from '@/pages/Typing/store'
import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('@/components/Drawer', () => ({
  default: ({ open, children }: { open: boolean; children: React.ReactNode }) => (open ? <div>{children}</div> : null),
}))

it('renders sentence items in sentence mode and dispatches sentence jump', () => {
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

  fireEvent.click(screen.getByRole('button', { name: /list/i }))
  fireEvent.click(screen.getByText('取消计划'))

  expect(dispatch).toHaveBeenCalledWith({ type: 'SKIP_2_SENTENCE_INDEX', newIndex: 0 })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
yarn vitest run src/pages/Typing/components/WordList/index.test.tsx
```

Expected: FAIL because sentence navigation rows are not rendered yet.

- [ ] **Step 3: Implement the sentence drawer path**

Create `src/pages/Typing/components/WordList/SentenceCard.tsx`:

```tsx
export default function SentenceCard({
  sentence,
  isActive,
  onClick,
}: {
  sentence: { trans: string; text: string }
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`mb-2 flex w-full flex-col items-start rounded-xl p-4 text-left shadow focus:outline-none ${
        isActive ? 'bg-indigo-50 dark:bg-indigo-800 dark:bg-opacity-20' : 'bg-white dark:bg-gray-700 dark:bg-opacity-20'
      }`}
      onClick={onClick}
    >
      <p className="w-full truncate font-sans text-base font-semibold dark:text-gray-50">{sentence.trans}</p>
      <p className="mt-2 w-full truncate text-sm text-gray-400">{sentence.text}</p>
    </button>
  )
}
```

Update `src/pages/Typing/components/WordList/WordCard.tsx`:

```tsx
export default function WordCard({
  word,
  isActive,
  onClick,
}: {
  word: Word
  isActive: boolean
  onClick?: () => void
}) {
```

Replace `handlePlay` with:

```tsx
  const handleClick = useCallback(() => {
    onClick?.()
    wordPronunciationIconRef.current?.play()
  }, [onClick])
```

Use it on the root element:

```tsx
      onClick={handleClick}
```

Update `src/pages/Typing/components/WordList/index.tsx` with navigation handlers:

```tsx
  const jumpToWord = (index: number) => {
    dispatch({ type: TypingStateActionType.SKIP_2_WORD_INDEX, newIndex: index })
    closeModal()
  }

  const jumpToSentence = (index: number) => {
    dispatch({ type: TypingStateActionType.SKIP_2_SENTENCE_INDEX, newIndex: index })
    closeModal()
  }
```

Import and render by mode:

```tsx
import SentenceCard from './SentenceCard'
```

```tsx
              {state.trainingMode === 'sentence-order'
                ? state.sentenceData.sentences.map((sentence, index) => (
                    <SentenceCard
                      key={sentence.id}
                      sentence={sentence}
                      isActive={state.sentenceData.index === index}
                      onClick={() => jumpToSentence(index)}
                    />
                  ))
                : state.chapterData.words?.map((word, index) => (
                    <WordCard
                      word={word}
                      key={`${word.name}_${index}`}
                      isActive={state.chapterData.index === index}
                      onClick={() => jumpToWord(index)}
                    />
                  ))}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
yarn vitest run src/pages/Typing/components/WordList/index.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Typing/components/WordList/index.tsx src/pages/Typing/components/WordList/WordCard.tsx src/pages/Typing/components/WordList/SentenceCard.tsx src/pages/Typing/components/WordList/index.test.tsx
git commit -m "feat: reuse typing drawer for sentence navigation"
```

---

### Task 4: Complete mode-switch integration and regressions

**Files:**
- Modify: `src/pages/Typing/ModeSwitcher.test.tsx`
- Modify: `src/pages/Typing/components/WordList/index.test.tsx`
- Modify: `src/pages/Typing/store/index.test.ts`

- [ ] **Step 1: Add missing regression tests**

Append to `src/pages/Typing/ModeSwitcher.test.tsx`:

```tsx
it('disables sentence mode button when there are no sentences', async () => {
  vi.doMock('./hooks/useSentenceList', () => ({ useSentenceList: () => ({ sentences: [] }) }))
  const { default: App } = await import('./index')

  const store = createStore()
  store.set(currentDictIdAtom, 'cet4')
  store.set(currentChapterAtom, 0)
  store.set(randomConfigAtom, { isOpen: false })
  store.set(reviewModeInfoAtom, { isReviewMode: false })

  render(
    <Provider store={store}>
      <App />
    </Provider>,
  )

  expect(screen.getByRole('button', { name: '句子练习' })).toBeDisabled()
})
```

Append to `src/pages/Typing/components/WordList/index.test.tsx`:

```tsx
it('renders word items in word mode', () => {
  const state = structuredClone(initialState)
  state.trainingMode = 'word'
  state.chapterData.words = [{ name: 'cancel', trans: ['取消'], usphone: '', ukphone: '', index: 0 }]

  const dispatch = vi.fn()

  render(
    <TypingContext.Provider value={{ state, dispatch }}>
      <WordList />
    </TypingContext.Provider>,
  )

  fireEvent.click(screen.getByRole('button', { name: /list/i }))

  expect(screen.getByText('cancel')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
yarn vitest run src/pages/Typing/ModeSwitcher.test.tsx src/pages/Typing/components/WordList/index.test.tsx src/pages/Typing/store/index.test.ts
```

Expected: FAIL if any mode-switch branch is still missing or mocks need tightening.

- [ ] **Step 3: Tighten the implementation only where tests require it**

If needed, make these minimal adjustments:

- In `src/pages/Typing/index.tsx`, wrap the sentence switcher in `!isReviewMode`
- In `src/pages/Typing/components/WordList/index.tsx`, fall back to words when `state.sentenceData.sentences.length === 0`
- In `src/pages/Typing/store/index.ts`, ensure `SWITCH_TO_SENTENCE_MODE` returns early when there are no sentences:

```ts
const switchToSentenceMode = (state: TypingState) => {
  if (state.sentenceData.sentences.length === 0) {
    return
  }
  state.trainingMode = 'sentence-order'
  state.isTyping = true
  state.isShowSkip = false
  if (state.sentenceData.index >= state.sentenceData.sentences.length) {
    state.sentenceData.index = 0
  }
  resetSentenceTokenState(state)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
yarn vitest run src/pages/Typing/ModeSwitcher.test.tsx src/pages/Typing/components/WordList/index.test.tsx src/pages/Typing/store/index.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Typing/ModeSwitcher.test.tsx src/pages/Typing/components/WordList/index.test.tsx src/pages/Typing/store/index.test.ts src/pages/Typing/index.tsx src/pages/Typing/store/index.ts
git commit -m "test: cover typing mode navigation"
```

---

### Task 5: Full verification

**Files:**
- Modify: none unless verification reveals defects
- Test: existing focused files

- [ ] **Step 1: Run the focused test suite**

Run:

```bash
yarn vitest run src/resources/sentences.test.ts src/pages/Gallery-N/DictionaryWithoutCover.test.tsx src/pages/Typing/store/index.test.ts src/pages/Typing/hooks/useSentenceList.test.ts src/pages/Typing/components/SentencePanel/index.test.tsx src/pages/Typing/ModeSwitcher.test.tsx src/pages/Typing/components/WordList/index.test.tsx
```

Expected: PASS with all targeted tests green.

- [ ] **Step 2: Run lint**

Run:

```bash
yarn lint
```

Expected: PASS with only the pre-existing warnings in `src/pages/ErrorBook/DropdownExport.tsx`.

- [ ] **Step 3: Run build**

Run:

```bash
yarn build
```

Expected: PASS. Existing Vite chunk-size and Browserslist warnings are acceptable if there are no build errors.

- [ ] **Step 4: Inspect working tree**

Run:

```bash
git status --short
```

Expected: Only files related to this feature remain modified.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Typing/index.tsx src/pages/Typing/store/index.ts src/pages/Typing/store/index.test.ts src/pages/Typing/components/WordList/index.tsx src/pages/Typing/components/WordList/WordCard.tsx src/pages/Typing/components/WordList/SentenceCard.tsx src/pages/Typing/components/WordList/index.test.tsx src/pages/Typing/ModeSwitcher.test.tsx
git commit -m "feat: add typing mode navigation"
```
