import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { SearchIcon } from 'lucide-react'

import { Icon } from './icon'

describe('Icon', () => {
  it('renders the lucide icon passed via the `icon` prop', async () => {
    const screen = await render(<Icon icon={SearchIcon} aria-label="Search" />)

    const icon = page.getByLabelText('Search')
    await expect.element(icon).toBeVisible()
    await expect.element(icon).toHaveAttribute('data-slot', 'icon')

    screen.unmount()
  })

  it('applies default size and color', async () => {
    const screen = await render(<Icon icon={SearchIcon} aria-label="Search" />)

    const icon = page.getByLabelText('Search')
    await expect.element(icon).toHaveAttribute('data-size', 'md')
    await expect.element(icon).toHaveAttribute('data-color', 'black')
    await expect.element(icon).toHaveClass(/size-4/)
    await expect.element(icon).toHaveClass(/text-foreground/)

    screen.unmount()
  })

  it('renders sm size', async () => {
    const screen = await render(<Icon icon={SearchIcon} size="sm" aria-label="Search" />)

    const icon = page.getByLabelText('Search')
    await expect.element(icon).toHaveAttribute('data-size', 'sm')
    await expect.element(icon).toHaveClass(/size-3/)

    screen.unmount()
  })

  it('renders xl size', async () => {
    const screen = await render(<Icon icon={SearchIcon} size="xl" aria-label="Search" />)

    const icon = page.getByLabelText('Search')
    await expect.element(icon).toHaveAttribute('data-size', 'xl')
    await expect.element(icon).toHaveClass(/size-6/)

    screen.unmount()
  })

  it('renders neutral color', async () => {
    const screen = await render(<Icon icon={SearchIcon} color="neutral" aria-label="Search" />)

    const icon = page.getByLabelText('Search')
    await expect.element(icon).toHaveAttribute('data-color', 'neutral')
    await expect.element(icon).toHaveClass(/text-muted-foreground/)

    screen.unmount()
  })
})
