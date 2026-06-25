import Tooltip from '@/components/Tooltip'
import { SoundIcon } from '@/components/WordPronunciationIcon/SoundIcon'
import { CTRL } from '@/utils'
import { useCallback } from 'react'

type SentencePronunciationButtonProps = {
  isPlaying: boolean
  onReplay: () => void
}

export default function SentencePronunciationButton({ isPlaying, onReplay }: SentencePronunciationButtonProps) {
  const handleReplay = useCallback(() => {
    onReplay()
  }, [onReplay])

  return (
    <Tooltip content={`重听句子（快捷键 ${CTRL} + J）`} className="h-9 w-9 cursor-pointer leading-7">
      <SoundIcon
        animated={isPlaying}
        onClick={handleReplay}
        className="h-9 w-9 cursor-pointer text-gray-600"
        iconClassName="h-full w-full"
      />
    </Tooltip>
  )
}
