import { getSentenceResourceUrl } from '@/resources/sentences'
import { currentChapterAtom, currentDictInfoAtom, reviewModeInfoAtom } from '@/store'
import type { SentenceItem } from '@/typings'
import { sentenceListFetcher } from '@/utils/sentenceListFetcher'
import { useAtomValue } from 'jotai'
import { useMemo } from 'react'
import useSWR from 'swr'

export const filterSentencesByChapter = (sentences: SentenceItem[], chapter: number) =>
  sentences.filter((sentence) => sentence.chapter === chapter)

export function useSentenceList() {
  const currentChapter = useAtomValue(currentChapterAtom)
  const currentDictInfo = useAtomValue(currentDictInfoAtom)
  const { isReviewMode } = useAtomValue(reviewModeInfoAtom)
  const resourceUrl = getSentenceResourceUrl(currentDictInfo.id)
  const { data = [], error, isLoading } = useSWR(resourceUrl ?? null, sentenceListFetcher)

  const sentences = useMemo(() => {
    if (isReviewMode) return []
    return filterSentencesByChapter(data, currentChapter)
  }, [currentChapter, data, isReviewMode])

  return { sentences, error, isLoading }
}
