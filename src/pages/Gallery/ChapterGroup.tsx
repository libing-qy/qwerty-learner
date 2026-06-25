import ChapterButton from './ChapterButton'
import { CHAPTER_LENGTH } from '@/constants'
import { currentChapterAtom, currentDictInfoAtom } from '@/store'
import { getChapterTitle } from '@/utils/getChapterTitle'
import range from '@/utils/range'
import { useAtom, useAtomValue } from 'jotai'
import type React from 'react'

const ChapterGroup: React.FC<ChapterGroupProps> = ({ totalWords }) => {
  const [currentChapter, setCurrentChapter] = useAtom(currentChapterAtom)
  const { id: dictID, chapterCount, chapterSize = CHAPTER_LENGTH, chapterTitles } = useAtomValue(currentDictInfoAtom)

  return (
    <main className="mr-4 grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {range(0, chapterCount, 1).map((index) =>
        index + 1 === chapterCount ? (
          <ChapterButton
            title={getChapterTitle(chapterTitles, index, 'en')}
            wordCount={totalWords % chapterSize || chapterSize}
            key={`${dictID}-${index}`}
            selected={currentChapter === index}
            index={index}
            onClick={() => setCurrentChapter(index)}
          />
        ) : (
          <ChapterButton
            title={getChapterTitle(chapterTitles, index, 'en')}
            wordCount={chapterSize}
            key={`${dictID}-${index}`}
            selected={currentChapter === index}
            index={index}
            onClick={() => setCurrentChapter(index)}
          />
        ),
      )}
    </main>
  )
}

export default ChapterGroup

export type ChapterGroupProps = {
  totalWords: number
}
