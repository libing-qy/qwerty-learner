import { fontSizeConfigAtom } from './index'
import { createStore } from 'jotai'
import { beforeEach, describe, expect, it } from 'vitest'

describe('fontSizeConfigAtom', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('migrates legacy stored sentence and translation defaults to the new defaults', () => {
    localStorage.setItem(
      'fontsize',
      JSON.stringify({
        foreignFont: 48,
        sentenceForeignFont: 48,
        translateFont: 18,
      }),
    )

    const store = createStore()
    const config = store.get(fontSizeConfigAtom)

    expect(config.foreignFont).toBe(48)
    expect(config.sentenceForeignFont).toBe(28)
    expect(config.translateFont).toBe(30)
  })
})
