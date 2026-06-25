import useSentencePronunciation from './useSentencePronunciation'
import * as pronunciationModule from '@/hooks/usePronunciation'
import * as speechModule from '@/hooks/useSpeech'
import { pronunciationConfigAtom } from '@/store'
import { act, renderHook, waitFor } from '@testing-library/react'
import { getDefaultStore } from 'jotai'
import { useEffect, useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const remotePlay = vi.fn()
const remoteStop = vi.fn()
const speechSpeak = vi.fn()
const speechCancel = vi.fn()

let remoteIsPlaying = false
let speechSpeaking = false
let speechReady = true

const usePronunciationSoundSpy = vi.spyOn(pronunciationModule, 'default')
const useSpeechSpy = vi.spyOn(speechModule, 'default')

describe('useSentencePronunciation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    remoteIsPlaying = false
    speechSpeaking = false
    speechReady = true
    getDefaultStore().set(pronunciationConfigAtom, {
      isOpen: true,
      volume: 1,
      type: 'us',
      name: '美音',
      isLoop: false,
      isTransRead: false,
      transVolume: 1,
      rate: 1,
    })

    usePronunciationSoundSpy.mockImplementation(() => ({
      play: remotePlay,
      stop: remoteStop,
      isPlaying: remoteIsPlaying,
    }))

    useSpeechSpy.mockImplementation(() => ({
      speak: speechSpeak,
      cancel: speechCancel,
      speaking: speechSpeaking,
      ready: speechReady,
    }))
  })

  it('auto-plays when entering a sentence id while autoPlay is true', async () => {
    renderHook((props) => useSentencePronunciation(props), {
      initialProps: {
        sentenceId: 'sentence-1',
        text: 'cancel the plan',
        autoPlay: true,
      },
    })

    await waitFor(() => {
      expect(remotePlay).toHaveBeenCalledTimes(1)
    })
    expect(speechSpeak).not.toHaveBeenCalled()
  })

  it('passes pronunciation volume and rate settings to browser speech fallback', () => {
    getDefaultStore().set(pronunciationConfigAtom, {
      isOpen: true,
      volume: 0.35,
      type: 'us',
      name: '美音',
      isLoop: false,
      isTransRead: false,
      transVolume: 1,
      rate: 0.85,
    })

    renderHook((props) => useSentencePronunciation(props), {
      initialProps: {
        sentenceId: 'sentence-1',
        text: 'cancel the plan',
        autoPlay: false,
      },
    })

    expect(useSpeechSpy).toHaveBeenCalledWith('cancel the plan', {
      volume: 0.35,
      rate: 0.85,
    })
  })

  it('does not replay when rerendering the same sentence id', async () => {
    const { rerender } = renderHook((props) => useSentencePronunciation(props), {
      initialProps: {
        sentenceId: 'sentence-1',
        text: 'cancel the plan',
        autoPlay: true,
      },
    })

    await waitFor(() => {
      expect(remotePlay).toHaveBeenCalledTimes(1)
    })

    rerender({
      sentenceId: 'sentence-1',
      text: 'cancel the updated plan',
      autoPlay: true,
    })

    expect(remotePlay).toHaveBeenCalledTimes(1)
  })

  it('auto-plays once when autoPlay flips to true for the current sentence', async () => {
    const { rerender } = renderHook((props) => useSentencePronunciation(props), {
      initialProps: {
        sentenceId: 'sentence-1',
        text: 'cancel the plan',
        autoPlay: false,
      },
    })

    expect(remotePlay).not.toHaveBeenCalled()

    rerender({
      sentenceId: 'sentence-1',
      text: 'cancel the plan',
      autoPlay: true,
    })

    await waitFor(() => {
      expect(remotePlay).toHaveBeenCalledTimes(1)
    })

    rerender({
      sentenceId: 'sentence-1',
      text: 'cancel the updated plan',
      autoPlay: true,
    })

    expect(remotePlay).toHaveBeenCalledTimes(1)
  })

  it('replays when the sentence id changes', async () => {
    const { rerender } = renderHook((props) => useSentencePronunciation(props), {
      initialProps: {
        sentenceId: 'sentence-1',
        text: 'cancel the plan',
        autoPlay: true,
      },
    })

    await waitFor(() => {
      expect(remotePlay).toHaveBeenCalledTimes(1)
    })

    rerender({
      sentenceId: 'sentence-2',
      text: 'persistent practice improves typing speed',
      autoPlay: true,
    })

    await waitFor(() => {
      expect(remotePlay).toHaveBeenCalledTimes(2)
    })
  })

  it('auto-plays the latest sentence audio after advancing to the next sentence', async () => {
    usePronunciationSoundSpy.mockImplementation((text: string) => {
      const [activeText, setActiveText] = useState(text)

      useEffect(() => {
        setActiveText(text)
      }, [text])

      return {
        play: () => remotePlay(activeText),
        stop: remoteStop,
        isPlaying: remoteIsPlaying,
      }
    })

    const { rerender } = renderHook((props) => useSentencePronunciation(props), {
      initialProps: {
        sentenceId: 'sentence-1',
        text: 'cancel the plan',
        autoPlay: true,
      },
    })

    await waitFor(() => {
      expect(remotePlay).toHaveBeenLastCalledWith('cancel the plan')
    })

    remotePlay.mockClear()

    rerender({
      sentenceId: 'sentence-2',
      text: 'the audience remained silent',
      autoPlay: true,
    })

    await waitFor(() => {
      expect(remotePlay).toHaveBeenCalledWith('the audience remained silent')
    })
  })

  it('does not replay the previous sentence when the remote pronunciation hook updates late', async () => {
    usePronunciationSoundSpy.mockImplementation((text: string) => {
      const [activeText, setActiveText] = useState(text)

      useEffect(() => {
        const timer = window.setTimeout(() => {
          setActiveText(text)
        }, 20)

        return () => {
          window.clearTimeout(timer)
        }
      }, [text])

      return {
        play: () => remotePlay(activeText),
        stop: remoteStop,
        isPlaying: remoteIsPlaying,
      }
    })

    const { rerender } = renderHook((props) => useSentencePronunciation(props), {
      initialProps: {
        sentenceId: 'sentence-1',
        text: 'cancel the plan',
        autoPlay: true,
      },
    })

    await waitFor(() => {
      expect(remotePlay).toHaveBeenLastCalledWith('cancel the plan')
    })

    remotePlay.mockClear()

    rerender({
      sentenceId: 'sentence-2',
      text: 'the audience remained silent',
      autoPlay: true,
    })

    await waitFor(() => {
      expect(remotePlay).toHaveBeenCalledWith('the audience remained silent')
    })
  })

  it('stops current playback before replaying a sentence', () => {
    const { result } = renderHook((props) => useSentencePronunciation(props), {
      initialProps: {
        sentenceId: 'sentence-1',
        text: 'cancel the plan',
        autoPlay: false,
      },
    })

    act(() => {
      result.current.replay()
    })

    expect(remoteStop).toHaveBeenCalledTimes(1)
    expect(speechCancel).toHaveBeenCalledTimes(1)
    expect(remotePlay).toHaveBeenCalledTimes(1)
  })

  it('stops previous playback before auto-playing the next sentence', async () => {
    const { rerender } = renderHook((props) => useSentencePronunciation(props), {
      initialProps: {
        sentenceId: 'sentence-1',
        text: 'cancel the plan',
        autoPlay: true,
      },
    })

    await waitFor(() => {
      expect(remotePlay).toHaveBeenCalledTimes(1)
    })

    vi.clearAllMocks()

    rerender({
      sentenceId: 'sentence-2',
      text: 'the audience remained silent',
      autoPlay: true,
    })

    await waitFor(() => {
      expect(remoteStop).toHaveBeenCalledTimes(1)
      expect(speechCancel).toHaveBeenCalledTimes(1)
      expect(remotePlay).toHaveBeenCalledTimes(1)
    })
  })

  it('falls back to browser speech when remote playback fails', () => {
    remotePlay.mockImplementationOnce(() => {
      throw new Error('remote audio failed')
    })

    const { result } = renderHook((props) => useSentencePronunciation(props), {
      initialProps: {
        sentenceId: 'sentence-1',
        text: 'cancel the plan',
        autoPlay: false,
      },
    })

    expect(() => {
      act(() => {
        result.current.replay()
      })
    }).not.toThrow()

    expect(remotePlay).toHaveBeenCalledTimes(1)
    expect(speechSpeak).toHaveBeenCalledTimes(1)
  })

  it('falls back to browser speech after remote audio reports an error', async () => {
    const OriginalAudio = globalThis.Audio

    class MockAudio {
      static instances: MockAudio[] = []

      onerror: ((event: Event) => void) | null = null
      oncanplaythrough: (() => void) | null = null
      src = ''
      preload = ''
      crossOrigin: string | null = null
      pause = vi.fn()

      constructor() {
        MockAudio.instances.push(this)
      }
    }

    globalThis.Audio = MockAudio as unknown as typeof Audio

    try {
      renderHook((props) => useSentencePronunciation(props), {
        initialProps: {
          sentenceId: 'sentence-1',
          text: 'cancel the plan',
          autoPlay: true,
        },
      })

      await waitFor(() => {
        expect(remotePlay).toHaveBeenCalledTimes(1)
      })
      const latestAudio = MockAudio.instances.at(-1)
      expect(latestAudio).toBeDefined()

      act(() => {
        latestAudio?.onerror?.(new Event('error'))
      })

      expect(speechSpeak).toHaveBeenCalledTimes(1)
    } finally {
      globalThis.Audio = OriginalAudio
    }
  })

  it('retries the browser speech fallback after an initial auto-play failure before speech is ready', async () => {
    remotePlay.mockImplementationOnce(() => {
      throw new Error('remote audio failed immediately')
    })

    useSpeechSpy.mockImplementation(() => {
      const [ready, setReady] = useState(false)

      useEffect(() => {
        setReady(true)
      }, [])

      return {
        speak: () => {
          if (ready) {
            speechSpeak()
          }
        },
        cancel: speechCancel,
        speaking: false,
        ready,
      }
    })

    renderHook((props) => useSentencePronunciation(props), {
      initialProps: {
        sentenceId: 'sentence-1',
        text: 'cancel the plan',
        autoPlay: true,
      },
    })

    await waitFor(() => {
      expect(remotePlay).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(speechSpeak).toHaveBeenCalledTimes(1)
    })
  })

  it('does not speak a stale sentence after navigation clears a pending fallback', async () => {
    speechReady = false
    remotePlay.mockImplementationOnce(() => {
      throw new Error('remote audio failed immediately')
    })

    const { rerender } = renderHook((props) => useSentencePronunciation(props), {
      initialProps: {
        sentenceId: 'sentence-1',
        text: 'cancel the plan',
        autoPlay: true,
      },
    })

    await waitFor(() => {
      expect(remotePlay).toHaveBeenCalledTimes(1)
    })
    expect(speechSpeak).not.toHaveBeenCalled()

    speechReady = true
    rerender({
      sentenceId: 'sentence-2',
      text: 'the audience remained silent',
      autoPlay: false,
    })

    expect(speechSpeak).not.toHaveBeenCalled()
  })

  it('cleans up the audio probe when stopped', async () => {
    const OriginalAudio = globalThis.Audio

    class MockAudio {
      static instances: MockAudio[] = []

      onerror: ((event: Event) => void) | null = null
      oncanplaythrough: (() => void) | null = null
      src = ''
      preload = ''
      crossOrigin: string | null = null
      pause = vi.fn()

      constructor() {
        MockAudio.instances.push(this)
      }
    }

    globalThis.Audio = MockAudio as unknown as typeof Audio

    try {
      const { result } = renderHook((props) => useSentencePronunciation(props), {
        initialProps: {
          sentenceId: 'sentence-1',
          text: 'cancel the plan',
          autoPlay: true,
        },
      })

      await waitFor(() => {
        expect(MockAudio.instances).toHaveLength(1)
      })

      act(() => {
        result.current.stop()
      })

      const latestAudio = MockAudio.instances.at(-1)
      expect(latestAudio?.pause).toHaveBeenCalledTimes(1)
      expect(latestAudio?.src).toBe('')
    } finally {
      globalThis.Audio = OriginalAudio
    }
  })

  it('stops both playback modes and exposes combined playing state', () => {
    remoteIsPlaying = true

    const { result, rerender } = renderHook((props) => useSentencePronunciation(props), {
      initialProps: {
        sentenceId: 'sentence-1',
        text: 'cancel the plan',
        autoPlay: false,
      },
    })

    expect(result.current.isPlaying).toBe(true)

    speechSpeaking = true
    remoteIsPlaying = false
    rerender({
      sentenceId: 'sentence-1',
      text: 'cancel the plan',
      autoPlay: false,
    })

    expect(result.current.isPlaying).toBe(true)

    act(() => {
      result.current.stop()
    })

    remoteIsPlaying = false
    speechSpeaking = false
    rerender({
      sentenceId: 'sentence-1',
      text: 'cancel the plan',
      autoPlay: false,
    })

    expect(remoteStop).toHaveBeenCalledTimes(1)
    expect(speechCancel).toHaveBeenCalledTimes(1)
    expect(result.current.isPlaying).toBe(false)
  })
})
