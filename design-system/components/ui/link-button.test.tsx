import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'

import { LinkButton } from './link-button'

describe('LinkButton', () => {
  it('has cursor-pointer', async () => {
    const screen = await render(<LinkButton>Click</LinkButton>)

    const button = page.getByRole('button', { name: 'Click' })
    await expect.element(button).toHaveClass(/cursor-pointer/)

    screen.unmount()
  })

  it('has pointer-events-none when disabled', async () => {
    const screen = await render(<LinkButton disabled>Click</LinkButton>)

    const button = page.getByRole('button', { name: 'Click' })
    await expect.element(button).toHaveAttribute('disabled', '')
    await expect.element(button).toHaveClass(/disabled:pointer-events-none/)
    await expect.element(button).toHaveClass(/disabled:opacity-50/)

    screen.unmount()
  })

  it('renders default variant', async () => {
    const screen = await render(<LinkButton>Default</LinkButton>)

    const button = page.getByRole('button', { name: 'Default' })
    await expect.element(button).toHaveAttribute('data-variant', 'default')
    await expect.element(button).toHaveClass(/text-primary/)

    screen.unmount()
  })

  it('renders secondary variant', async () => {
    const screen = await render(<LinkButton variant="secondary">Secondary</LinkButton>)

    const button = page.getByRole('button', { name: 'Secondary' })
    await expect.element(button).toHaveAttribute('data-variant', 'secondary')
    await expect.element(button).toHaveClass(/text-muted-foreground/)

    screen.unmount()
  })
})
