import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

describe('Tooltip', () => {
  it('renders trigger and shows tooltip on hover without external TooltipProvider', async () => {
    const screen = await render(
      <Tooltip delayDuration={0}>
        <TooltipTrigger>Hover me</TooltipTrigger>
        <TooltipContent>Tooltip text</TooltipContent>
      </Tooltip>,
    )

    await expect.element(page.getByText('Hover me')).toBeVisible()
    await expect.element(page.getByText('Tooltip text')).not.toBeInTheDocument()

    await userEvent.hover(page.getByText('Hover me').element())
    await expect.element(page.getByText('Tooltip text')).toBeVisible()

    await expect.element(page.getByText('Hover me')).toHaveAttribute('data-slot', 'tooltip-trigger')

    screen.unmount()
  })

  it('works with asChild on trigger', async () => {
    const screen = await render(
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <button type="button">Custom button</button>
        </TooltipTrigger>
        <TooltipContent>Button tooltip</TooltipContent>
      </Tooltip>,
    )

    const trigger = page.getByRole('button', { name: 'Custom button' })
    await expect.element(trigger).toBeVisible()

    await userEvent.hover(trigger.element())
    await expect.element(page.getByText('Button tooltip')).toBeVisible()

    screen.unmount()
  })

  it('shows tooltip on specified side', async () => {
    const screen = await render(
      <Tooltip delayDuration={0}>
        <TooltipTrigger>Side trigger</TooltipTrigger>
        <TooltipContent side="bottom">Bottom tooltip</TooltipContent>
      </Tooltip>,
    )

    await userEvent.hover(page.getByText('Side trigger').element())
    await expect.element(page.getByText('Bottom tooltip')).toBeVisible()

    screen.unmount()
  })

  it('renders with custom className on content', async () => {
    const screen = await render(
      <Tooltip delayDuration={0}>
        <TooltipTrigger>Class trigger</TooltipTrigger>
        <TooltipContent className="custom-class">Styled tooltip</TooltipContent>
      </Tooltip>,
    )

    await userEvent.hover(page.getByText('Class trigger').element())

    const content = page.getByText('Styled tooltip')
    await expect.element(content).toBeVisible()

    screen.unmount()
  })

  it('also works when wrapped with TooltipProvider (backwards compatible)', async () => {
    const screen = await render(
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger>Provider trigger</TooltipTrigger>
          <TooltipContent>Provider tooltip</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    )

    await userEvent.hover(page.getByText('Provider trigger').element())
    await expect.element(page.getByText('Provider tooltip')).toBeVisible()

    screen.unmount()
  })

  it('respects external open state when controlled', async () => {
    const screen = await render(
      <Tooltip delayDuration={0} open={true}>
        <TooltipTrigger>Controlled trigger</TooltipTrigger>
        <TooltipContent>Forced open</TooltipContent>
      </Tooltip>,
    )

    // When `open` is forced true and no `onOpenChange` is provided, the
    // tooltip stays open regardless of hover/focus — this is the behavior
    // the ClickTrigger story relies on.
    await expect.element(page.getByText('Forced open')).toBeVisible()

    screen.unmount()
  })

  it('stays closed when controlled with open=false even on hover', async () => {
    const screen = await render(
      <Tooltip delayDuration={0} open={false}>
        <TooltipTrigger>Locked trigger</TooltipTrigger>
        <TooltipContent>Should not appear</TooltipContent>
      </Tooltip>,
    )

    await userEvent.hover(page.getByText('Locked trigger').element())
    await expect.element(page.getByText('Should not appear')).not.toBeInTheDocument()

    screen.unmount()
  })

  it('supports data-slot attributes', async () => {
    const screen = await render(
      <Tooltip delayDuration={0}>
        <TooltipTrigger>Slot trigger</TooltipTrigger>
        <TooltipContent>Slot tooltip</TooltipContent>
      </Tooltip>,
    )

    await expect.element(page.getByText('Slot trigger')).toHaveAttribute('data-slot', 'tooltip-trigger')

    await userEvent.hover(page.getByText('Slot trigger').element())
    await expect.element(page.getByText('Slot tooltip')).toBeVisible()

    // data-slot is on the Content wrapper, not the text node
    const contentEl = page.getByText('Slot tooltip').element().closest('[data-slot="tooltip-content"]')
    expect(contentEl).not.toBeNull()

    screen.unmount()
  })
})
