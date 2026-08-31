import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './accordion'

describe('Accordion', () => {
  it('AccordionTrigger has cursor-pointer', async () => {
    const screen = await render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    )

    const trigger = page.getByRole('button', { name: 'Trigger' })
    await expect.element(trigger).toHaveClass(/cursor-pointer/)

    screen.unmount()
  })

  it('AccordionTrigger has pointer-events-none when disabled', async () => {
    const screen = await render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1" disabled>
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    )

    const trigger = page.getByRole('button', { name: 'Trigger' })
    await expect.element(trigger).toHaveAttribute('disabled', '')
    await expect.element(trigger).toHaveClass(/disabled:pointer-events-none/)
    await expect.element(trigger).toHaveClass(/disabled:opacity-50/)

    screen.unmount()
  })
})
