import shuffle from '@/utils/shuffle'
import { useRef } from 'react'

export default function ScrambledTokens({ tokens, sentenceId }: { tokens: string[]; sentenceId: string }) {
  const previousSentenceIdRef = useRef<string | undefined>(undefined)
  const scrambledRef = useRef<string[]>([])

  if (previousSentenceIdRef.current !== sentenceId) {
    scrambledRef.current = shuffle(tokens.map((token) => ({ token }))).map((item) => item.token)
    previousSentenceIdRef.current = sentenceId
  }

  const scrambled = scrambledRef.current

  return (
    <div className="mb-6 flex flex-wrap justify-center gap-2">
      {scrambled.map((token, index) => (
        <span
          key={`${token}-${index}`}
          className="rounded-full bg-indigo-100 px-4 py-2 text-lg font-medium text-indigo-700 dark:bg-gray-700 dark:text-indigo-200"
        >
          {token}
        </span>
      ))}
    </div>
  )
}
