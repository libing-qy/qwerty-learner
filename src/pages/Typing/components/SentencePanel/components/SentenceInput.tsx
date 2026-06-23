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
