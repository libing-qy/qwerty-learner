import WordCard from './WordCard'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'

it('navigates when the word card body is clicked and keeps pronunciation as a separate action', () => {
  const onClick = vi.fn()

  render(<WordCard word={{ name: 'cancel', trans: ['取消'], usphone: '', ukphone: '', index: 0 }} isActive={false} onClick={onClick} />)

  fireEvent.click(screen.getByText('cancel'))
  expect(onClick).toHaveBeenCalledTimes(1)

  fireEvent.click(screen.getAllByRole('button')[0])
  expect(onClick).toHaveBeenCalledTimes(1)
})
