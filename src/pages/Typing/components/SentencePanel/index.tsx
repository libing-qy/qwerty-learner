import ScrambledTokens from './components/ScrambledTokens'
import SentenceInput from './components/SentenceInput'
import SentencePrompt from './components/SentencePrompt'
import { TypingContext } from '@/pages/Typing/store'
import { useContext } from 'react'

export default function SentencePanel() {
  const typingContext = useContext(TypingContext)
  if (!typingContext) return null

  const { state } = typingContext
  const sentence = state.sentenceData.sentences[state.sentenceData.index]

  if (!sentence) return null

  return (
    <div className="container flex h-full w-full flex-col items-center justify-center">
      <SentencePrompt />
      <ScrambledTokens sentenceId={sentence.id} tokens={sentence.tokens} />
      <SentenceInput />
    </div>
  )
}
