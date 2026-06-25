import { idDictionaryMap } from './dictionary'
import { describe, expect, it } from 'vitest'

describe('dictionary resources', () => {
  it('registers the self-study English I textbook vocabulary course from folder 00012', () => {
    expect(idDictionaryMap['self-study_English1_00012']).toMatchObject({
      name: '自考英语一教材词汇 00012',
      tags: ['自考英语一'],
      url: '/dicts/self-study_English1_00012.json',
      length: 37,
      chapterCount: 1,
      chapterTitles: ['Speaking Activity'],
    })
  })
})
