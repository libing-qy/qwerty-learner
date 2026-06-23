import { expect, Page, test } from '@playwright/test'

const pressWord = async (page: Page, word: string) => {
  const letters = word.split('')
  for (const letter of letters) {
    await page.keyboard.press(letter)
  }
}

const pressWords = async (page: Page, words: string[]) => {
  for (const word of words) {
    await pressWord(page, word)
    await page.waitForTimeout(300)
  }
}

const completeFirstSentenceChapter = async (page: Page) => {
  await pressWord(page, 'cancel')
  await page.keyboard.press('Space')
  await pressWord(page, 'the')
  await page.keyboard.press('Space')
  await pressWord(page, 'plan')
  await page.keyboard.press('Space')

  await pressWord(page, 'the')
  await page.keyboard.press('Space')
  await pressWord(page, 'audience')
  await page.keyboard.press('Space')
  await pressWord(page, 'remained')
  await page.keyboard.press('Space')
  await pressWord(page, 'silent')
  await page.keyboard.press('Space')
}

test.describe('Practice', () => {
  test.beforeEach(async ({ page }) => {
    test.slow()
    await page.goto('/')
    const closeTip = page.getByLabel('关闭提示')
    if (await closeTip.isVisible().catch(() => false)) {
      await closeTip.click()
    }
  })

  test('Press any key to start', async ({ page }) => {
    await expect(await page.getByText('按任意键开始').isVisible()).toBeTruthy()

    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)
    await expect(await page.locator('p').getByText('按任意键开始').isHidden()).toBeTruthy()
  })

  test('Enter the correct word', async ({ page }) => {
    await page.keyboard.press('Enter')

    await pressWord(page, 'cancel')

    await page.locator('div', { hasText: '正确率' }).locator('span', { hasText: '100' }).click()

    // auto show next word: explosive
    await expect(await page.locator('span', { hasText: /^e$/ }).first().isVisible()).toBeTruthy()
    await expect(await page.locator('span', { hasText: /^x$/ }).isVisible()).toBeTruthy()
    await expect(await page.locator('span', { hasText: /^p$/ }).isVisible()).toBeTruthy()
    await expect(await page.locator('span', { hasText: /^l$/ }).isVisible()).toBeTruthy()
    await expect(await page.locator('span', { hasText: /^o$/ }).isVisible()).toBeTruthy()
    await expect(await page.locator('span', { hasText: /^s$/ }).isVisible()).toBeTruthy()
    await expect(await page.locator('span', { hasText: /^i$/ }).isVisible()).toBeTruthy()
    await expect(await page.locator('span', { hasText: /^v$/ }).isVisible()).toBeTruthy()
    await expect(await page.locator('span', { hasText: /^e$/ }).last().isVisible()).toBeTruthy()
  })

  test('Enter the wrong word', async ({ page }) => {
    await page.keyboard.press('Enter')

    await pressWord(page, 'canca')

    await expect(page.getByText('输入数').locator('xpath=preceding-sibling::span[1]')).toHaveText('6')
    await expect(page.getByText('正确数').locator('xpath=preceding-sibling::span[1]')).toHaveText('4')
    await page.waitForTimeout(500)
    await expect(page.getByText('正确率').locator('xpath=preceding-sibling::span[1]')).toHaveText('67')
  })

  test('Enter the correct letter, should show green color', async ({ page }) => {
    await page.keyboard.press('Enter')

    await page.keyboard.press('c')
    await expect(page.locator('span', { hasText: /^c$/ }).first()).toHaveClass(/text-green-600/)

    await page.keyboard.press('a')
    await expect(page.locator('span', { hasText: /^a$/ })).toHaveClass(/text-green-600/)

    await page.keyboard.press('n')
    await expect(page.locator('span', { hasText: /^n$/ })).toHaveClass(/text-green-600/)
  })

  test('Enter the wrong letter, should show red color', async ({ page }) => {
    await page.keyboard.press('Enter')
    await expect(page.locator('span', { hasText: /^c$/ }).first()).toHaveClass(/text-gray-600/)

    await page.keyboard.press('a')
    await expect(page.locator('span', { hasText: /^c$/ }).first()).toHaveClass(/text-red-600/)

    await page.waitForTimeout(500)
    await expect(page.locator('span', { hasText: /^c$/ }).first()).toHaveClass(/text-gray-600/)
  })

  test('Complete the exercises for 1 chapter, enter the next chapter', async ({ page }) => {
    await page.keyboard.press('Enter')

    const chapter1 = [
      'cancel',
      'explosive',
      'numerous',
      'govern',
      'analyse',
      'discourage',
      'resemble',
      'remote',
      'salary',
      'pollution',
      'pretend',
      'kettle',
      'wreck',
      'drunk',
      'calculate',
      'persistent',
      'sake',
      'conceal',
      'audience',
      'meanwhile',
    ]

    await pressWords(page, chapter1)

    await expect(page.getByText('连词成句')).toBeVisible()
    await completeFirstSentenceChapter(page)

    await expect(page.getByText('正确率：100%')).toBeVisible()
    await expect(await page.getByText('表现不错！全对了！').isVisible()).toBeTruthy()

    await page.getByRole('button', { name: '下一章节' }).click()

    await expect(await page.getByText('第 2 章').first().isVisible()).toBeTruthy()
  })

  test('Complete chapter words and automatically enter sentence order training', async ({ page }) => {
    await page.keyboard.press('Enter')

    const chapter1 = [
      'cancel',
      'explosive',
      'numerous',
      'govern',
      'analyse',
      'discourage',
      'resemble',
      'remote',
      'salary',
      'pollution',
      'pretend',
      'kettle',
      'wreck',
      'drunk',
      'calculate',
      'persistent',
      'sake',
      'conceal',
      'audience',
      'meanwhile',
    ]

    await pressWords(page, chapter1)

    await expect(page.getByText('连词成句')).toBeVisible()
    await expect(page.getByText('取消计划')).toBeVisible()

    await pressWord(page, 'cancel')
    await page.keyboard.press('Space')
    await pressWord(page, 'the')
    await page.keyboard.press('Space')
    await pressWord(page, 'plan')
    await page.keyboard.press('Space')

    await expect(page.getByText('观众保持安静')).toBeVisible()
  })
})
