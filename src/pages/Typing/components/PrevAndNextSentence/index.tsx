import { TypingContext, TypingStateActionType } from '../../store'
import Tooltip from '@/components/Tooltip'
import { useCallback, useContext, useMemo } from 'react'
import IconPrev from '~icons/tabler/arrow-narrow-left'
import IconNext from '~icons/tabler/arrow-narrow-right'

export default function PrevAndNextSentence({ type }: { type: 'prev' | 'next' }) {
  // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
  const { state, dispatch } = useContext(TypingContext)!

  const newIndex = useMemo(() => state.sentenceData.index + (type === 'prev' ? -1 : 1), [state.sentenceData.index, type])
  const sentence = state.sentenceData.sentences[newIndex]

  const onClickSentence = useCallback(() => {
    if (!sentence) return

    dispatch({ type: TypingStateActionType.SKIP_2_SENTENCE_INDEX, newIndex })
  }, [dispatch, newIndex, sentence])

  if (!sentence) {
    return <div />
  }

  return (
    <Tooltip content={type === 'prev' ? '上一句' : '下一句'}>
      <div
        onClick={onClickSentence}
        className="flex max-w-xs cursor-pointer select-none items-center text-gray-700 opacity-60 duration-200 ease-in-out hover:opacity-100 dark:text-gray-400"
      >
        {type === 'prev' && <IconPrev className="mr-4 shrink-0 grow-0 text-2xl" />}

        <div className={`grow-1 flex w-full flex-col ${type === 'next' ? 'items-end text-right' : ''}`}>
          <p className="line-clamp-1 max-w-full font-mono text-2xl font-normal text-gray-700 dark:text-gray-400">{sentence.text}</p>
          <p className="line-clamp-1 max-w-full text-sm font-normal text-gray-600 dark:text-gray-500">{sentence.trans}</p>
        </div>

        {type === 'next' && <IconNext className="ml-4 shrink-0 grow-0 text-2xl" />}
      </div>
    </Tooltip>
  )
}
