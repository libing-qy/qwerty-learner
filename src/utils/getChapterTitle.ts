export type ChapterTitleLocale = 'zh' | 'en'

export function getChapterTitle(chapterTitles: string[] | undefined, index: number, locale: ChapterTitleLocale) {
  const customTitle = chapterTitles?.[index]?.trim()
  if (customTitle) {
    return customTitle
  }

  const chapterNumber = index + 1
  return locale === 'zh' ? `第 ${chapterNumber} 章` : `Chapter ${chapterNumber}`
}
