import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'

import { Button } from './button'

describe('Button', () => {
  it('renders with default variant and size', async () => {
    const screen = await render(<Button>Click me</Button>)

    const button = page.getByRole('button', { name: 'Click me' })
    await expect.element(button).toBeVisible()
    await expect.element(button).toHaveAttribute('data-slot', 'button')
    await expect.element(button).toHaveAttribute('data-variant', 'default')
    await expect.element(button).toHaveAttribute('data-size', 'default')
    await expect.element(button).toHaveClass(/bg-primary/)
    await expect.element(button).toHaveClass(/cursor-pointer/)

    screen.unmount()
  })

  it('renders secondary variant', async () => {
    const screen = await render(<Button variant="secondary">Secondary</Button>)

    const button = page.getByRole('button', { name: 'Secondary' })
    await expect.element(button).toHaveAttribute('data-variant', 'secondary')
    await expect.element(button).toHaveClass(/bg-secondary/)

    screen.unmount()
  })

  it('renders outline variant', async () => {
    const screen = await render(<Button variant="outline">Outline</Button>)

    const button = page.getByRole('button', { name: 'Outline' })
    await expect.element(button).toHaveAttribute('data-variant', 'outline')
    await expect.element(button).toHaveClass(/border/)

    screen.unmount()
  })

  it('renders ghost variant', async () => {
    const screen = await render(<Button variant="ghost">Ghost</Button>)

    const button = page.getByRole('button', { name: 'Ghost' })
    await expect.element(button).toHaveAttribute('data-variant', 'ghost')
    await expect.element(button).toHaveClass(/bg-transparent/)

    screen.unmount()
  })

  it('renders destructive variant', async () => {
    const screen = await render(<Button variant="destructive">Delete</Button>)

    const button = page.getByRole('button', { name: 'Delete' })
    await expect.element(button).toHaveAttribute('data-variant', 'destructive')
    await expect.element(button).toHaveClass(/bg-destructive/)

    screen.unmount()
  })

  it('renders info variant', async () => {
    const screen = await render(<Button variant="info">Info</Button>)

    const button = page.getByRole('button', { name: 'Info' })
    await expect.element(button).toHaveAttribute('data-variant', 'info')
    await expect.element(button).toHaveClass(/bg-info/)

    screen.unmount()
  })

  it('renders warning variant', async () => {
    const screen = await render(<Button variant="warning">Warning</Button>)

    const button = page.getByRole('button', { name: 'Warning' })
    await expect.element(button).toHaveAttribute('data-variant', 'warning')
    await expect.element(button).toHaveClass(/bg-warning/)

    screen.unmount()
  })

  it('renders success variant', async () => {
    const screen = await render(<Button variant="success">Success</Button>)

    const button = page.getByRole('button', { name: 'Success' })
    await expect.element(button).toHaveAttribute('data-variant', 'success')
    await expect.element(button).toHaveClass(/bg-success/)

    screen.unmount()
  })

  it('renders sm size', async () => {
    const screen = await render(<Button size="sm">Small</Button>)

    const button = page.getByRole('button', { name: 'Small' })
    await expect.element(button).toHaveAttribute('data-size', 'sm')
    await expect.element(button).toHaveClass(/h-8/)

    screen.unmount()
  })

  it('renders lg size', async () => {
    const screen = await render(<Button size="lg">Large</Button>)

    const button = page.getByRole('button', { name: 'Large' })
    await expect.element(button).toHaveAttribute('data-size', 'lg')
    await expect.element(button).toHaveClass(/h-10/)

    screen.unmount()
  })

  it('renders xs size', async () => {
    const screen = await render(<Button size="xs">Mini</Button>)

    const button = page.getByRole('button', { name: 'Mini' })
    await expect.element(button).toHaveAttribute('data-size', 'xs')
    await expect.element(button).toHaveClass(/h-6/)

    screen.unmount()
  })

  it('renders icon size', async () => {
    const screen = await render(<Button size="icon" aria-label="Icon button">★</Button>)

    const button = page.getByRole('button', { name: 'Icon button' })
    await expect.element(button).toHaveAttribute('data-size', 'icon')
    await expect.element(button).toHaveClass(/size-9/)

    screen.unmount()
  })

  it('has pointer-events-none when disabled', async () => {
    const screen = await render(<Button disabled>Disabled</Button>)

    const button = page.getByRole('button', { name: 'Disabled' })
    await expect.element(button).toHaveAttribute('disabled', '')
    await expect.element(button).toHaveClass(/disabled:pointer-events-none/)
    await expect.element(button).toHaveClass(/disabled:opacity-50/)

    screen.unmount()
  })

  it('applies custom className', async () => {
    const screen = await render(<Button className="custom-class">Custom</Button>)

    const button = page.getByRole('button', { name: 'Custom' })
    await expect.element(button).toHaveClass(/custom-class/)

    screen.unmount()
  })

  it('renders as child when asChild is true', async () => {
    const screen = await render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    )

    const link = page.getByRole('link', { name: 'Link Button' })
    await expect.element(link).toBeVisible()
    await expect.element(link).toHaveAttribute('data-slot', 'button')

    screen.unmount()
  })
})
