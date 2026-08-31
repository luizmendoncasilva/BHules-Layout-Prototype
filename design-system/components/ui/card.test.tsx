import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card'

describe('Card', () => {
  it('renders with default md padding', async () => {
    const screen = await render(
      <Card data-testid="card">
        <CardHeader data-testid="header">
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent data-testid="content">Body</CardContent>
        <CardFooter data-testid="footer">Footer</CardFooter>
      </Card>,
    )

    const card = page.getByTestId('card')
    await expect.element(card).toHaveAttribute('data-slot', 'card')
    await expect.element(card).toHaveAttribute('data-padding', 'md')
    await expect.element(card).toHaveClass(/py-6/)
    await expect.element(page.getByTestId('header')).toHaveClass(/px-6/)
    await expect.element(page.getByTestId('content')).toHaveClass(/px-6/)
    await expect.element(page.getByTestId('footer')).toHaveClass(/px-6/)

    screen.unmount()
  })

  it('applies sm padding to the card and its sub-components', async () => {
    const screen = await render(
      <Card padding="sm" data-testid="card">
        <CardHeader data-testid="header">Header</CardHeader>
        <CardContent data-testid="content">Body</CardContent>
        <CardFooter data-testid="footer">Footer</CardFooter>
      </Card>,
    )

    await expect.element(page.getByTestId('card')).toHaveAttribute('data-padding', 'sm')
    await expect.element(page.getByTestId('card')).toHaveClass(/py-3/)
    await expect.element(page.getByTestId('header')).toHaveClass(/px-3/)
    await expect.element(page.getByTestId('content')).toHaveClass(/px-3/)
    await expect.element(page.getByTestId('footer')).toHaveClass(/px-3/)

    screen.unmount()
  })

  it('applies lg padding', async () => {
    const screen = await render(
      <Card padding="lg" data-testid="card">
        <CardContent data-testid="content">Body</CardContent>
      </Card>,
    )

    await expect.element(page.getByTestId('card')).toHaveClass(/py-8/)
    await expect.element(page.getByTestId('content')).toHaveClass(/px-8/)

    screen.unmount()
  })

  it('applies none padding', async () => {
    const screen = await render(
      <Card padding="none" data-testid="card">
        <CardContent data-testid="content">Body</CardContent>
      </Card>,
    )

    await expect.element(page.getByTestId('card')).toHaveClass(/py-0/)
    await expect.element(page.getByTestId('content')).toHaveClass(/px-0/)

    screen.unmount()
  })

  it('renders sub-components with their own data-slot attributes', async () => {
    const screen = await render(
      <Card>
        <CardHeader data-testid="header">
          <CardTitle data-testid="title">Title</CardTitle>
          <CardDescription data-testid="description">Description</CardDescription>
        </CardHeader>
        <CardContent data-testid="content">Body</CardContent>
        <CardFooter data-testid="footer">Footer</CardFooter>
      </Card>,
    )

    await expect.element(page.getByTestId('header')).toHaveAttribute('data-slot', 'card-header')
    await expect.element(page.getByTestId('title')).toHaveAttribute('data-slot', 'card-title')
    await expect.element(page.getByTestId('description')).toHaveAttribute('data-slot', 'card-description')
    await expect.element(page.getByTestId('content')).toHaveAttribute('data-slot', 'card-content')
    await expect.element(page.getByTestId('footer')).toHaveAttribute('data-slot', 'card-footer')

    screen.unmount()
  })
})
