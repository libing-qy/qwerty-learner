import usePronunciationSound, { generateWordSoundSrc } from '@/hooks/usePronunciation'
import useSpeech from '@/hooks/useSpeech'
import { pronunciationConfigAtom } from '@/store'
import { useAtomValue } from 'jotai'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const isJsdomEnvironment = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)
const AUTO_PLAY_DELAY_MS = 50

export type UseSentencePronunciationParams = {
  sentenceId: string
  text: string
  autoPlay: boolean
}

export type UseSentencePronunciationResult = {
  replay: () => void
  stop: () => void
  isPlaying: boolean
}

export default function useSentencePronunciation({
  sentenceId,
  text,
  autoPlay,
}: UseSentencePronunciationParams): UseSentencePronunciationResult {
  const pronunciationConfig = useAtomValue(pronunciationConfigAtom)
  const { play, stop: stopPronunciation, isPlaying: pronunciationPlaying } = usePronunciationSound(text)
  const speechOptions = useMemo(
    () => ({
      volume: pronunciationConfig.volume,
      rate: pronunciationConfig.rate,
    }),
    [pronunciationConfig.rate, pronunciationConfig.volume],
  )
  const { speak, cancel, speaking, ready: speechReady } = useSpeech(text, speechOptions)
  const lastAutoPlayedSentenceIdRef = useRef<string | null>(null)
  const pendingAutoPlaySentenceIdRef = useRef<string | null>(null)
  const audioProbeRef = useRef<HTMLAudioElement | null>(null)
  const autoPlayTimerRef = useRef<number | null>(null)
  const [pendingSpeechFallbackSentenceId, setPendingSpeechFallbackSentenceId] = useState<string | null>(null)
  const remoteAudioSrc = useMemo(() => generateWordSoundSrc(text, pronunciationConfig.type), [pronunciationConfig.type, text])

  useEffect(() => {
    setPendingSpeechFallbackSentenceId(null)
  }, [sentenceId])

  useEffect(() => {
    if (pendingSpeechFallbackSentenceId !== sentenceId || !speechReady) return

    setPendingSpeechFallbackSentenceId(null)
    cancel()
    stopPronunciation()
    speak(true)
  }, [cancel, pendingSpeechFallbackSentenceId, sentenceId, speak, speechReady, stopPronunciation])

  const requestSpeechFallback = useCallback(() => {
    if (speechReady) {
      speak(true)
      return
    }

    setPendingSpeechFallbackSentenceId(sentenceId)
  }, [sentenceId, speak, speechReady])

  const clearAudioProbe = useCallback(() => {
    const audioProbe = audioProbeRef.current
    if (!audioProbe) return

    audioProbe.onerror = null
    audioProbe.oncanplaythrough = null
    const shouldPauseAudioProbe = !isJsdomEnvironment || !(audioProbe instanceof HTMLAudioElement)
    if (shouldPauseAudioProbe) {
      audioProbe.pause()
    }
    audioProbe.src = ''
    audioProbeRef.current = null
  }, [])

  const clearAutoPlayTimer = useCallback(() => {
    if (autoPlayTimerRef.current === null) return

    window.clearTimeout(autoPlayTimerRef.current)
    autoPlayTimerRef.current = null
  }, [])

  const startAudioProbe = useCallback(() => {
    if (!remoteAudioSrc || typeof Audio === 'undefined') return

    clearAudioProbe()

    const audioProbe = new Audio()
    audioProbe.preload = 'auto'
    audioProbe.crossOrigin = 'anonymous'
    audioProbe.onerror = () => {
      if (audioProbeRef.current !== audioProbe) return

      clearAudioProbe()
      stopPronunciation()
      requestSpeechFallback()
    }
    audioProbe.oncanplaythrough = () => {
      if (audioProbeRef.current !== audioProbe) return
      clearAudioProbe()
    }
    audioProbe.src = remoteAudioSrc

    audioProbeRef.current = audioProbe
  }, [clearAudioProbe, remoteAudioSrc, requestSpeechFallback, stopPronunciation])

  const stop = useCallback(() => {
    clearAutoPlayTimer()
    pendingAutoPlaySentenceIdRef.current = null
    setPendingSpeechFallbackSentenceId(null)
    clearAudioProbe()
    stopPronunciation()
    cancel()
  }, [cancel, clearAudioProbe, clearAutoPlayTimer, stopPronunciation])

  const replay = useCallback(() => {
    stop()

    try {
      play()
      startAudioProbe()
    } catch {
      requestSpeechFallback()
    }
  }, [play, requestSpeechFallback, startAudioProbe, stop])

  const replayRef = useRef(replay)

  useEffect(() => {
    replayRef.current = replay
  }, [replay])

  useEffect(() => {
    const hasAutoPlayedCurrentSentence = lastAutoPlayedSentenceIdRef.current === sentenceId
    const hasPendingAutoPlayForCurrentSentence = pendingAutoPlaySentenceIdRef.current === sentenceId

    if (!autoPlay || hasAutoPlayedCurrentSentence || hasPendingAutoPlayForCurrentSentence) return

    clearAutoPlayTimer()
    pendingAutoPlaySentenceIdRef.current = sentenceId
    autoPlayTimerRef.current = window.setTimeout(() => {
      autoPlayTimerRef.current = null
      if (pendingAutoPlaySentenceIdRef.current !== sentenceId) return

      pendingAutoPlaySentenceIdRef.current = null
      lastAutoPlayedSentenceIdRef.current = sentenceId
      replayRef.current()
    }, AUTO_PLAY_DELAY_MS)

    return () => {
      if (pendingAutoPlaySentenceIdRef.current === sentenceId) {
        pendingAutoPlaySentenceIdRef.current = null
      }
      clearAutoPlayTimer()
    }
  }, [autoPlay, clearAutoPlayTimer, sentenceId])

  useEffect(
    () => () => {
      clearAutoPlayTimer()
      clearAudioProbe()
    },
    [clearAudioProbe, clearAutoPlayTimer],
  )

  return {
    replay,
    stop,
    isPlaying: pronunciationPlaying || speaking,
  }
}
