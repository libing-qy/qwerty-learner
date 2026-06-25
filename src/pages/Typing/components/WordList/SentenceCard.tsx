import SentencePronunciationButton from '../SentencePanel/components/SentencePronunciationButton'
import useSentencePronunciation from '@/pages/Typing/hooks/useSentencePronunciation'
import type { SentenceItem } from '@/typings'
import { useCallback } from 'react'

export default function SentenceCard({ sentence, isActive, onClick }: { sentence: SentenceItem; isActive: boolean; onClick: () => void }) {
  const { replay, isPlaying } = useSentencePronunciation({
    sentenceId: sentence.id,
    text: sentence.text,
    autoPlay: false,
  })

  const handleReplay = useCallback(() => {
    replay()
  }, [replay])

  return (
    <div
      className={`mb-2 flex w-full flex-col items-start rounded-xl p-4 text-left shadow focus:outline-none ${
        isActive ? 'bg-indigo-50 dark:bg-indigo-800 dark:bg-opacity-20' : 'bg-white dark:bg-gray-700 dark:bg-opacity-20'
      }`}
    >
      <div className="flex w-full items-start gap-3">
        <button type="button" className="flex-1 text-left" onClick={onClick}>
          <p className="w-full truncate font-mono text-lg font-normal leading-6 dark:text-gray-50">{sentence.text}</p>
          <p className="mt-2 w-full truncate font-sans text-sm text-gray-400">{sentence.trans}</p>
        </button>
        <div onClick={(event) => event.stopPropagation()}>
          <SentencePronunciationButton isPlaying={isPlaying} onReplay={handleReplay} />
        </div>
      </div>
    </div>
  )
}
