import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'

import { Badge } from './badge'

describe('Badge', () => {
  it('renders with default variant', async () => {
    const screen = await render(<Badge>Default</Badge>)

    const badge = page.getByText('Default')
    await expect.element(badge).toBeVisible()
    await expect.element(badge).toHaveAttribute('data-slot', 'badge')
    await expect.element(badge).toHaveAttribute('data-variant', 'default')
    await expect.element(badge).toHaveClass(/bg-primary/)

    screen.unmount()
  })

  it('renders secondary variant', async () => {
    const screen = await render(<Badge variant="secondary">Secondary</Badge>)

    const badge = page.getByText('Secondary')
    await expect.element(badge).toHaveAttribute('data-variant', 'secondary')
    await expect.element(badge).toHaveClass(/bg-secondary/)

    screen.unmount()
  })

  it('renders outline variant', async () => {
    const screen = await render(<Badge variant="outline">Outline</Badge>)

    const badge = page.getByText('Outline')
    await expect.element(badge).toHaveAttribute('data-variant', 'outline')
    await expect.element(badge).toHaveClass(/border-border/)

    screen.unmount()
  })

  it('renders ghost variant', async () => {
    const screen = await render(<Badge variant="ghost">Ghost</Badge>)

    const badge = page.getByText('Ghost')
    await expect.element(badge).toHaveAttribute('data-variant', 'ghost')
    await expect.element(badge).toHaveClass(/bg-transparent/)

    screen.unmount()
  })

  it('renders destructive variant', async () => {
    const screen = await render(<Badge variant="destructive">Destructive</Badge>)

    const badge = page.getByText('Destructive')
    await expect.element(badge).toHaveAttribute('data-variant', 'destructive')
    await expect.element(badge).toHaveClass(/bg-destructive/)

    screen.unmount()
  })

  it('renders success variant', async () => {
    const screen = await render(<Badge variant="success">Success</Badge>)

    const badge = page.getByText('Success')
    await expect.element(badge).toHaveAttribute('data-variant', 'success')
    await expect.element(badge).toHaveClass(/bg-success/)

    screen.unmount()
  })

  it('renders warning variant', async () => {
    const screen = await render(<Badge variant="warning">Warning</Badge>)

    const badge = page.getByText('Warning')
    await expect.element(badge).toHaveAttribute('data-variant', 'warning')
    await expect.element(badge).toHaveClass(/bg-warning/)

    screen.unmount()
  })

  it('renders info variant', async () => {
    const screen = await render(<Badge variant="info">Info</Badge>)

    const badge = page.getByText('Info')
    await expect.element(badge).toHaveAttribute('data-variant', 'info')
    await expect.element(badge).toHaveClass(/bg-info/)

    screen.unmount()
  })

  it('applies custom className', async () => {
    const screen = await render(<Badge className="custom-class">Custom</Badge>)

    const badge = page.getByText('Custom')
    await expect.element(badge).toHaveClass(/custom-class/)

    screen.unmount()
  })

  it('renders as child when asChild is true', async () => {
    const screen = await render(
      <Badge asChild>
        <a href="/test">Link Badge</a>
      </Badge>
    )

    const link = page.getByRole('link', { name: 'Link Badge' })
    await expect.element(link).toBeVisible()
    await expect.element(link).toHaveAttribute('data-slot', 'badge')

    screen.unmount()
  })
})
