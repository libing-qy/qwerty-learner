import ScrambledTokens from './components/ScrambledTokens'
import SentenceInput from './components/SentenceInput'
import SentencePrompt from './components/SentencePrompt'
import SentencePronunciationButton from './components/SentencePronunciationButton'
import useSentencePronunciation from '@/pages/Typing/hooks/useSentencePronunciation'
import { TypingContext } from '@/pages/Typing/store'
import { pronunciationIsOpenAtom, wordDictationConfigAtom } from '@/store'
import { useAtomValue } from 'jotai'
import { useContext, useEffect } from 'react'

type SentencePanelProps = {
  setReplayHandler?: (handler: (() => void) | null) => void
}

export default function SentencePanel({ setReplayHandler }: SentencePanelProps) {
  const typingContext = useContext(TypingContext)
  const state = typingContext?.state
  const sentence = state.sentenceData.sentences[state.sentenceData.index]
  const pronunciationIsOpen = useAtomValue(pronunciationIsOpenAtom)
  const wordDictationConfig = useAtomValue(wordDictationConfigAtom)

  const { replay, isPlaying } = useSentencePronunciation({
    sentenceId: sentence?.id ?? '',
    text: sentence?.text ?? '',
    autoPlay: Boolean(sentence) && state.isTyping && pronunciationIsOpen,
  })

  useEffect(() => {
    setReplayHandler?.(replay)

    return () => {
      setReplayHandler?.(null)
    }
  }, [replay, setReplayHandler])

  if (!typingContext || !sentence) return null

  return (
    <div className="container flex h-full w-full flex-col items-center justify-center">
      <SentencePrompt />
      {pronunciationIsOpen && (
        <div className="mb-6 flex items-center justify-center">
          <SentencePronunciationButton isPlaying={isPlaying} onReplay={replay} />
        </div>
      )}
      {!wordDictationConfig.isOpen && <ScrambledTokens sentenceId={sentence.id} tokens={sentence.tokens} />}
      <SentenceInput />
    </div>
  )
}
