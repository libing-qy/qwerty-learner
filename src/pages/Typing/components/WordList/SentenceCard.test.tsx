import SentenceCard from './SentenceCard'
import * as sentencePronunciationModule from '@/pages/Typing/hooks/useSentencePronunciation'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach } from 'vitest'
import { expect, it, vi } from 'vitest'

const replaySentencePronunciation = vi.fn()

const useSentencePronunciationSpy = vi.spyOn(sentencePronunciationModule, 'default')
beforeEach(() => {
  replaySentencePronunciation.mockReset()
  useSentencePronunciationSpy.mockReturnValue({
    replay: replaySentencePronunciation,
    stop: vi.fn(),
    isPlaying: false,
  })
})

it('keeps sentence navigation and pronunciation as separate actions', () => {
  const onClick = vi.fn()

  render(
    <SentenceCard
      sentence={{
        id: 'cet4-0-0',
        text: 'cancel the plan',
        tokens: ['cancel', 'the', 'plan'],
        trans: '取消计划',
        chapter: 0,
        sourceDictId: 'cet4',
      }}
      isActive={false}
      onClick={onClick}
    />,
  )

  expect(useSentencePronunciationSpy).toHaveBeenCalledWith({
    sentenceId: 'cet4-0-0',
    text: 'cancel the plan',
    autoPlay: false,
  })

  fireEvent.click(screen.getByText('cancel the plan'))
  expect(onClick).toHaveBeenCalledTimes(1)

  fireEvent.click(screen.getAllByRole('button')[1])
  expect(replaySentencePronunciation).toHaveBeenCalledTimes(1)
  expect(onClick).toHaveBeenCalledTimes(1)
})
