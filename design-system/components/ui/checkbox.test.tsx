import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'

import { Checkbox } from './checkbox'

describe('Checkbox', () => {
  it('has cursor-pointer', async () => {
    const screen = await render(<Checkbox />)

    const checkbox = page.getByRole('checkbox')
    await expect.element(checkbox).toHaveClass(/cursor-pointer/)

    screen.unmount()
  })

  it('has cursor-not-allowed when disabled', async () => {
    const screen = await render(<Checkbox disabled />)

    const checkbox = page.getByRole('checkbox')
    await expect.element(checkbox).toHaveAttribute('disabled', '')
    await expect.element(checkbox).toHaveClass(/disabled:cursor-not-allowed/)
    await expect.element(checkbox).toHaveClass(/disabled:opacity-50/)

    screen.unmount()
  })
})
