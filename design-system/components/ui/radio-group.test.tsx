import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'

import { RadioGroup, RadioGroupItem } from './radio-group'

describe('RadioGroup', () => {
  it('RadioGroupItem has cursor-pointer', async () => {
    const screen = await render(
      <RadioGroup>
        <RadioGroupItem value="option1" />
      </RadioGroup>,
    )

    const radio = page.getByRole('radio')
    await expect.element(radio).toHaveClass(/cursor-pointer/)

    screen.unmount()
  })

  it('RadioGroupItem has cursor-not-allowed when disabled', async () => {
    const screen = await render(
      <RadioGroup>
        <RadioGroupItem value="option1" disabled />
      </RadioGroup>,
    )

    const radio = page.getByRole('radio')
    await expect.element(radio).toHaveAttribute('disabled', '')
    await expect.element(radio).toHaveClass(/disabled:cursor-not-allowed/)
    await expect.element(radio).toHaveClass(/disabled:opacity-50/)

    screen.unmount()
  })
})
