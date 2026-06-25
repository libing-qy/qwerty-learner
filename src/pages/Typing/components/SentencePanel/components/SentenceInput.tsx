import useKeySounds from '@/hooks/useKeySounds'
import { TypingContext, TypingStateActionType } from '@/pages/Typing/store'
import { fontSizeConfigAtom } from '@/store'
import { useAtomValue } from 'jotai'
import { useContext, useEffect, useState } from 'react'

export default function SentenceInput() {
  const typingContext = useContext(TypingContext)
  const fontSizeConfig = useAtomValue(fontSizeConfigAtom)
  const [value, setValue] = useState('')
  const [hasError, setHasError] = useState(false)
  const [playKeySound, playWrongSound] = useKeySounds()
  const state = typingContext?.state
  const trainingMode = state?.trainingMode
  const sentenceIndex = state?.sentenceData.index

  useEffect(() => {
    if (trainingMode === undefined || sentenceIndex === undefined) return

    setValue('')
    setHasError(false)
  }, [sentenceIndex, trainingMode])

  if (!typingContext) return null

  const { dispatch } = typingContext
  const sentence = state.sentenceData.sentences[state.sentenceData.index]
  if (!sentence) return null

  const targetToken = sentence.tokens[state.sentenceData.tokenIndex] ?? ''
  const completedTokens = sentence.tokens.slice(0, state.sentenceData.tokenIndex)

  const submitToken = () => {
    const token = value.trim()
    if (!token) return

    if (token.toLowerCase() === targetToken.toLowerCase()) {
      setHasError(false)
      dispatch({ type: TypingStateActionType.REPORT_CORRECT_TOKEN, payload: { token } })
      const isLastToken = state.sentenceData.tokenIndex >= sentence.tokens.length - 1
      if (isLastToken) {
        dispatch({ type: TypingStateActionType.NEXT_SENTENCE })
      }
    } else {
      setHasError(true)
      playWrongSound()
      dispatch({ type: TypingStateActionType.REPORT_WRONG_TOKEN, payload: { token } })
    }

    setValue('')
  }

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-3 text-gray-700 dark:text-gray-200">
        {completedTokens.map((token, index) => (
          <span
            key={`${token}-${index}`}
            className="rounded bg-green-100 px-3 py-2 font-medium dark:bg-green-900"
            style={{ fontSize: fontSizeConfig.sentenceForeignFont.toString() + 'px' }}
          >
            {token}
          </span>
        ))}
      </div>
      <input
        aria-label="sentence-token-input"
        autoFocus
        className={`w-full rounded-xl border px-4 py-3 text-center text-2xl outline-none dark:bg-gray-800 dark:text-white ${
          hasError ? 'border-red-500 focus:border-red-500' : 'border-indigo-300 focus:border-indigo-500'
        }`}
        style={{ fontSize: fontSizeConfig.sentenceForeignFont.toString() + 'px' }}
        value={value}
        onChange={(e) => {
          setHasError(false)
          setValue(e.target.value)
        }}
        onKeyDown={(e) => {
          if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter')) {
            playKeySound()
          }

          if (e.key !== ' ' && e.key !== 'Enter') return
          e.preventDefault()
          submitToken()
        }}
      />
    </div>
  )
}
