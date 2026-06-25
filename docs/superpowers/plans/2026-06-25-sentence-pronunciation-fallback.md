# Sentence Pronunciation Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add sentence-mode auto pronunciation and manual replay so each sentence tries Youdao audio first and falls back silently to browser speech when remote playback fails.

**Architecture:** Keep the existing word pronunciation path unchanged. Add a sentence-specific pronunciation hook that combines the current Youdao audio approach with `useSpeech()` fallback, then wire it into sentence-mode UI so auto-play happens on sentence entry and replay is available through both a button and `Ctrl + J`.

**Tech Stack:** React, TypeScript, Jotai, `use-sound`/Howler, Web Speech API, Vitest, Testing Library

---

## File map

- Create: `src/pages/Typing/hooks/useSentencePronunciation.ts`
  - Owns sentence audio orchestration: remote audio attempt, silent fallback to speech, replay helpers, and sentence auto-play lifecycle helpers.
- Create: `src/pages/Typing/hooks/useSentencePronunciation.test.ts`
  - Covers fallback behavior and replay control at hook level.
- Create: `src/pages/Typing/components/SentencePanel/components/SentencePronunciationButton.tsx`
  - Small focused replay button for sentence mode, mirroring the word pronunciation affordance.
- Modify: `src/pages/Typing/components/SentencePanel/index.tsx`
  - Wires the current sentence into the new pronunciation hook and renders the replay button.
- Modify: `src/pages/Typing/components/WordPanel/index.tsx`
  - Adds the sentence replay hotkey and ensures sentence navigation-triggered sentence changes still cause auto-play through normal render flow.
- Modify: `src/pages/Typing/components/SentencePanel/index.test.tsx`
  - Adds component-level regression coverage for auto-play and manual replay.
- Modify: `src/test/setup.ts`
  - Adds lightweight speech-synthesis mocks if needed for stable test execution.

---

### Task 1: Build the sentence pronunciation hook

**Files:**
- Create: `src/pages/Typing/hooks/useSentencePronunciation.test.ts`
- Create: `src/pages/Typing/hooks/useSentencePronunciation.ts`

- [ ] **Step 1: Write the failing hook tests**

```ts
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockPlay = vi.fn()
const mockStop = vi.fn()
const mockSpeak = vi.fn()
const mockCancel = vi.fn()

vi.mock('@/hooks/usePronunciation', () => ({
  default: () => ({
    play: mockPlay,
    stop: mockStop,
    isPlaying: false,
  }),
  generateWordSoundSrc: (text: string) => `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=2`,
}))

vi.mock('@/hooks/useSpeech', () => ({
  default: () => ({
    speak: mockSpeak,
    cancel: mockCancel,
    speaking: false,
  }),
}))

describe('useSentencePronunciation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('auto plays with remote audio when a new sentence id is entered', () => {
    const { result, rerender } = renderHook(
      ({ sentenceId, text }) => useSentencePronunciation({ sentenceId, text, autoPlay: true }),
      { initialProps: { sentenceId: 's1', text: 'cancel the plan' } },
    )

    expect(mockPlay).toHaveBeenCalledTimes(1)
    expect(mockSpeak).not.toHaveBeenCalled()

    rerender({ sentenceId: 's1', text: 'cancel the plan' })
    expect(mockPlay).toHaveBeenCalledTimes(1)

    rerender({ sentenceId: 's2', text: 'the audience remained silent' })
    expect(mockPlay).toHaveBeenCalledTimes(2)
    expect(result.current.replay).toBeTypeOf('function')
  })

  it('falls back to browser speech after remote playback failure', async () => {
    let playErrorHandler: (() => void) | undefined
    ;(globalThis as { Audio?: unknown }).Audio = class {
      onerror: null | (() => void) = null
      oncanplaythrough: null | (() => void) = null
      src = ''
      preload = ''
      play = vi.fn()
      pause = vi.fn()
      addEventListener(event: string, cb: () => void) {
        if (event === 'error') playErrorHandler = cb
      }
      removeEventListener() {}
    } as unknown as typeof Audio

    renderHook(() => useSentencePronunciation({ sentenceId: 's1', text: 'persistent practice improves typing speed', autoPlay: true }))

    await act(async () => {
      playErrorHandler?.()
    })

    expect(mockSpeak).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run the hook test to verify it fails**

Run: `yarn vitest run src/pages/Typing/hooks/useSentencePronunciation.test.ts --threads=false`
Expected: FAIL because `useSentencePronunciation.ts` does not exist yet.

- [ ] **Step 3: Write the minimal hook implementation**

```ts
import usePronunciationSound from '@/hooks/usePronunciation'
import useSpeech from '@/hooks/useSpeech'
import { useCallback, useEffect, useRef, useState } from 'react'

type SentencePronunciationOptions = {
  sentenceId: string
  text: string
  autoPlay: boolean
}

export function useSentencePronunciation({ sentenceId, text, autoPlay }: SentencePronunciationOptions) {
  const { play, stop, isPlaying } = usePronunciationSound(text)
  const { speak, cancel, speaking } = useSpeech(text)
  const previousSentenceIdRef = useRef<string | undefined>(undefined)
  const [shouldUseSpeechFallback, setShouldUseSpeechFallback] = useState(false)

  const playRemoteFirst = useCallback(() => {
    cancel()
    stop()
    if (shouldUseSpeechFallback) {
      speak(true)
      return
    }
    play()
  }, [cancel, play, shouldUseSpeechFallback, speak, stop])

  const replay = useCallback(() => {
    playRemoteFirst()
  }, [playRemoteFirst])

  useEffect(() => {
    if (!autoPlay) return
    if (previousSentenceIdRef.current === sentenceId) return

    previousSentenceIdRef.current = sentenceId
    playRemoteFirst()
  }, [autoPlay, playRemoteFirst, sentenceId])

  useEffect(() => {
    setShouldUseSpeechFallback(false)
  }, [sentenceId])

  useEffect(() => {
    const originalAudio = globalThis.Audio
    if (!originalAudio) return

    const audio = new originalAudio()
    const handleError = () => setShouldUseSpeechFallback(true)
    audio.addEventListener('error', handleError)
    audio.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=2`
    return () => {
      audio.removeEventListener('error', handleError)
      audio.pause?.()
    }
  }, [text])

  useEffect(() => {
    if (!shouldUseSpeechFallback) return
    cancel()
    stop()
    speak(true)
  }, [cancel, shouldUseSpeechFallback, speak, stop])

  return {
    replay,
    stop: useCallback(() => {
      cancel()
      stop()
    }, [cancel, stop]),
    isPlaying: isPlaying || speaking,
  }
}
```

- [ ] **Step 4: Run the hook test to verify it passes**

Run: `yarn vitest run src/pages/Typing/hooks/useSentencePronunciation.test.ts --threads=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Typing/hooks/useSentencePronunciation.ts src/pages/Typing/hooks/useSentencePronunciation.test.ts
git commit -m "feat: add sentence pronunciation fallback hook"
```

### Task 2: Add sentence replay UI and auto-play wiring

**Files:**
- Create: `src/pages/Typing/components/SentencePanel/components/SentencePronunciationButton.tsx`
- Modify: `src/pages/Typing/components/SentencePanel/index.tsx`
- Modify: `src/pages/Typing/components/SentencePanel/index.test.tsx`

- [ ] **Step 1: Extend the sentence panel tests with failing cases**

```tsx
it('auto plays the current sentence when entering a new sentence', () => {
  const replay = vi.fn()
  vi.mock('@/pages/Typing/hooks/useSentencePronunciation', () => ({
    useSentencePronunciation: () => ({ replay, stop: vi.fn(), isPlaying: false }),
  }))

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

  render(
    <TypingContext.Provider value={{ state, dispatch: vi.fn() }}>
      <SentencePanel />
    </TypingContext.Provider>,
  )

  expect(screen.getByRole('button', { name: '重播句子发音' })).toBeInTheDocument()
})

it('replays the current sentence when clicking the pronunciation button', () => {
  const replay = vi.fn()
  vi.mock('@/pages/Typing/hooks/useSentencePronunciation', () => ({
    useSentencePronunciation: () => ({ replay, stop: vi.fn(), isPlaying: false }),
  }))

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

  render(
    <TypingContext.Provider value={{ state, dispatch: vi.fn() }}>
      <SentencePanel />
    </TypingContext.Provider>,
  )

  fireEvent.click(screen.getByRole('button', { name: '重播句子发音' }))
  expect(replay).toHaveBeenCalledTimes(1)
})
```

- [ ] **Step 2: Run the sentence panel test to verify it fails**

Run: `yarn vitest run src/pages/Typing/components/SentencePanel/index.test.tsx --threads=false`
Expected: FAIL because the sentence replay button is not rendered yet.

- [ ] **Step 3: Implement the sentence replay button and panel wiring**

```tsx
// src/pages/Typing/components/SentencePanel/components/SentencePronunciationButton.tsx
import Tooltip from '@/components/Tooltip'
import { SoundIcon } from '@/components/WordPronunciationIcon/SoundIcon'

export default function SentencePronunciationButton({ isPlaying, onReplay }: { isPlaying: boolean; onReplay: () => void }) {
  return (
    <Tooltip content="重播句子发音（Ctrl + J）">
      <button type="button" aria-label="重播句子发音" className="absolute -right-12 top-1/2 h-9 w-9 -translate-y-1/2 transform" onClick={onReplay}>
        <SoundIcon animated={isPlaying} className="h-full w-full cursor-pointer text-gray-600" />
      </button>
    </Tooltip>
  )
}
```

```tsx
// src/pages/Typing/components/SentencePanel/index.tsx
import ScrambledTokens from './components/ScrambledTokens'
import SentenceInput from './components/SentenceInput'
import SentencePronunciationButton from './components/SentencePronunciationButton'
import SentencePrompt from './components/SentencePrompt'
import { useSentencePronunciation } from '../../hooks/useSentencePronunciation'
import { TypingContext } from '@/pages/Typing/store'
import { useContext } from 'react'

export default function SentencePanel() {
  const typingContext = useContext(TypingContext)
  if (!typingContext) return null

  const { state } = typingContext
  const sentence = state.sentenceData.sentences[state.sentenceData.index]

  if (!sentence) return null

  const { replay, isPlaying } = useSentencePronunciation({
    sentenceId: sentence.id,
    text: sentence.text,
    autoPlay: state.isTyping,
  })

  return (
    <div className="container flex h-full w-full flex-col items-center justify-center">
      <SentencePrompt />
      <div className="relative">
        <ScrambledTokens sentenceId={sentence.id} tokens={sentence.tokens} />
        <SentencePronunciationButton isPlaying={isPlaying} onReplay={replay} />
      </div>
      <SentenceInput />
    </div>
  )
}
```

- [ ] **Step 4: Run the sentence panel test to verify it passes**

Run: `yarn vitest run src/pages/Typing/components/SentencePanel/index.test.tsx --threads=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Typing/components/SentencePanel/index.tsx src/pages/Typing/components/SentencePanel/index.test.tsx src/pages/Typing/components/SentencePanel/components/SentencePronunciationButton.tsx
git commit -m "feat: add sentence pronunciation replay UI"
```

### Task 3: Add sentence replay hotkey and sentence-mode integration coverage

**Files:**
- Modify: `src/pages/Typing/components/WordPanel/index.tsx`
- Modify: `src/pages/Typing/AutoSwitchToSentence.integration.test.tsx`
- Modify: `src/test/setup.ts`

- [ ] **Step 1: Write the failing integration coverage for sentence replay control**

```tsx
it('replays the current sentence with Ctrl + J in sentence mode', async () => {
  const replay = vi.fn()
  vi.mock('./hooks/useSentencePronunciation', () => ({
    useSentencePronunciation: () => ({ replay, stop: vi.fn(), isPlaying: false }),
  }))

  const { default: App } = await import('./index')
  renderApp(<App />)

  fireEvent.keyDown(window, { key: 'j', ctrlKey: true })
  expect(replay).toHaveBeenCalledTimes(1)
})
```

- [ ] **Step 2: Run the integration coverage to verify it fails**

Run: `yarn vitest run src/pages/Typing/AutoSwitchToSentence.integration.test.tsx --threads=false`
Expected: FAIL because sentence mode does not register a replay hotkey yet.

- [ ] **Step 3: Implement the sentence replay hotkey and test support**

```tsx
// src/pages/Typing/components/WordPanel/index.tsx
const sentenceReplayRef = useRef<(() => void) | null>(null)

useHotkeys(
  'ctrl+j',
  () => {
    if (state.trainingMode === 'sentence-order' && state.isTyping) {
      sentenceReplayRef.current?.()
    }
  },
  [state.isTyping, state.trainingMode],
  { enableOnFormTags: true, preventDefault: true },
)

if (state.trainingMode === 'sentence-order') {
  return (
    <div className="container flex h-full w-full flex-col items-center justify-center">
      <div className="container flex h-24 w-full shrink-0 grow-0 justify-between px-12 pt-10">
        {isShowPrevAndNextWord && state.isTyping && (
          <>
            <PrevAndNextSentence type="prev" />
            <PrevAndNextSentence type="next" />
          </>
        )}
      </div>
      <SentencePanel setReplayHandler={(handler) => (sentenceReplayRef.current = handler)} />
      <Progress className={`mb-10 mt-auto ${state.isTyping ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  )
}
```

```ts
// src/test/setup.ts
if (!window.speechSynthesis) {
  Object.defineProperty(window, 'speechSynthesis', {
    writable: true,
    value: {
      speaking: false,
      speak: () => undefined,
      cancel: () => undefined,
    },
  })
}

if (typeof globalThis.SpeechSynthesisUtterance === 'undefined') {
  Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
    writable: true,
    value: class {
      text: string
      constructor(text: string) {
        this.text = text
      }
      addEventListener() {}
      removeEventListener() {}
    },
  })
}
```

- [ ] **Step 4: Run the integration coverage to verify it passes**

Run: `yarn vitest run src/pages/Typing/AutoSwitchToSentence.integration.test.tsx --threads=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Typing/components/WordPanel/index.tsx src/pages/Typing/AutoSwitchToSentence.integration.test.tsx src/test/setup.ts
git commit -m "feat: add sentence pronunciation hotkey"
```

### Task 4: Full verification

**Files:**
- Verify only

- [ ] **Step 1: Run the full Typing test suite**

Run: `yarn vitest run src/pages/Typing --threads=false`
Expected: PASS with all Typing tests green.

- [ ] **Step 2: Run lint**

Run: `yarn lint`
Expected: PASS with the existing `DropdownExport.tsx` warnings only.

- [ ] **Step 3: Run build**

Run: `yarn build`
Expected: PASS.

- [ ] **Step 4: Commit any final formatting updates**

```bash
git add src/pages/Typing src/test/setup.ts
git commit -m "test: verify sentence pronunciation fallback"
```
