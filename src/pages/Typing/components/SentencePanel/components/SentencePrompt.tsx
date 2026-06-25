import { TypingContext } from '@/pages/Typing/store'
import { fontSizeConfigAtom } from '@/store'
import { useAtomValue } from 'jotai'
import { useContext } from 'react'

export default function SentencePrompt() {
  const typingContext = useContext(TypingContext)
  const fontSizeConfig = useAtomValue(fontSizeConfigAtom)
  if (!typingContext) return null

  const { state } = typingContext
  const sentence = state.sentenceData.sentences[state.sentenceData.index]
  if (!sentence) return null

  return (
    <div className="mb-6 flex flex-col items-center gap-3">
      <p className="text-base text-gray-500 dark:text-gray-300">连词成句</p>
      {state.isTransVisible && (
        <p className="font-semibold text-gray-900 dark:text-white" style={{ fontSize: fontSizeConfig.translateFont.toString() + 'px' }}>
          {sentence.trans}
        </p>
      )}
      <p className="text-sm text-gray-400">
        第 {state.sentenceData.index + 1} / {state.sentenceData.sentences.length} 句
      </p>
    </div>
  )
}
