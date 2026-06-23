import shuffle from '@/utils/shuffle'
import { useMemo } from 'react'

export default function ScrambledTokens({ tokens }: { tokens: string[] }) {
  const scrambled = useMemo(() => shuffle(tokens.map((token) => ({ token }))).map((item) => item.token), [tokens])

  return (
    <div className="mb-6 flex flex-wrap justify-center gap-2">
      {scrambled.map((token, index) => (
        <span
          key={`${token}-${index}`}
          className="rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-700 dark:bg-gray-700 dark:text-indigo-200"
        >
          {token}
        </span>
      ))}
    </div>
  )
}
