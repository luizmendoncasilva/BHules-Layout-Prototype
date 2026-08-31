import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'

import { Toggle } from './toggle'

describe('Toggle', () => {
  it('has cursor-pointer', async () => {
    const screen = await render(<Toggle aria-label="Toggle bold">B</Toggle>)

    const toggle = page.getByRole('button', { name: 'Toggle bold' })
    await expect.element(toggle).toHaveClass(/cursor-pointer/)

    screen.unmount()
  })

  it('has pointer-events-none when disabled', async () => {
    const screen = await render(<Toggle aria-label="Toggle bold" disabled>B</Toggle>)

    const toggle = page.getByRole('button', { name: 'Toggle bold' })
    await expect.element(toggle).toHaveAttribute('disabled', '')
    await expect.element(toggle).toHaveClass(/disabled:pointer-events-none/)
    await expect.element(toggle).toHaveClass(/disabled:opacity-50/)

    screen.unmount()
  })
})
