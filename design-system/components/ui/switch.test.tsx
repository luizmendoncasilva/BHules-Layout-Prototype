import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'

import { Switch } from './switch'

describe('Switch', () => {
  it('has cursor-pointer', async () => {
    const screen = await render(<Switch />)

    const switchEl = page.getByRole('switch')
    await expect.element(switchEl).toHaveClass(/cursor-pointer/)

    screen.unmount()
  })

  it('has cursor-not-allowed when disabled', async () => {
    const screen = await render(<Switch disabled />)

    const switchEl = page.getByRole('switch')
    await expect.element(switchEl).toHaveAttribute('disabled', '')
    await expect.element(switchEl).toHaveClass(/disabled:cursor-not-allowed/)
    await expect.element(switchEl).toHaveClass(/disabled:opacity-50/)

    screen.unmount()
  })
})
