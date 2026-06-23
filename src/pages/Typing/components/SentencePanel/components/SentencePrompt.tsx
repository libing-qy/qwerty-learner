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
