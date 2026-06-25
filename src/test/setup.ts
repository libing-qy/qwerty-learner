import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { webcrypto } from 'node:crypto'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
  })
}

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  })
}

if (!window.speechSynthesis) {
  Object.defineProperty(window, 'speechSynthesis', {
    writable: true,
    value: {
      speaking: false,
      speak: () => undefined,
      cancel: () => undefined,
    },
  })
}

if (typeof globalThis.SpeechSynthesisUtterance === 'undefined') {
  Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
    writable: true,
    value: class {
      text: string

      constructor(text: string) {
        this.text = text
      }

      addEventListener() {
        return undefined
      }

      removeEventListener() {
        return undefined
      }
    },
  })
}
