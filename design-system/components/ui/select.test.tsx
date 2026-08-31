import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'

describe('Select', () => {
  it('SelectTrigger has cursor-pointer', async () => {
    const screen = await render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="opt1">Option 1</SelectItem>
        </SelectContent>
      </Select>,
    )

    const trigger = page.getByRole('combobox')
    await expect.element(trigger).toHaveClass(/cursor-pointer/)

    screen.unmount()
  })

  it('SelectTrigger has cursor-not-allowed when disabled', async () => {
    const screen = await render(
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="opt1">Option 1</SelectItem>
        </SelectContent>
      </Select>,
    )

    const trigger = page.getByRole('combobox')
    await expect.element(trigger).toHaveAttribute('disabled', '')
    await expect.element(trigger).toHaveClass(/disabled:cursor-not-allowed/)
    await expect.element(trigger).toHaveClass(/disabled:opacity-50/)

    screen.unmount()
  })

  it('clears an uncontrolled selection when the active item is re-clicked', async () => {
    const screen = await render(
      <Select defaultValue="b">
        <SelectTrigger>
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
          <SelectItem value="b">Option B</SelectItem>
        </SelectContent>
      </Select>,
    )

    const trigger = page.getByRole('combobox')
    await expect.element(trigger).toHaveTextContent('Option B')

    await trigger.click()
    await page.getByRole('option', { name: 'Option B' }).click()

    // Re-clicking the selected item returns to the placeholder (empty) state
    // and closes the menu.
    await expect.element(trigger).toHaveTextContent('Select...')
    await expect.element(trigger).toHaveAttribute('aria-expanded', 'false')

    screen.unmount()
  })

  it('emits onValueChange("") when a controlled selection is cleared', async () => {
    const received: string[] = []

    function ControlledHarness() {
      const [value, setValue] = React.useState('b')
      return (
        <Select
          value={value}
          onValueChange={(next) => {
            received.push(next)
            setValue(next)
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
            <SelectItem value="b">Option B</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    const screen = await render(<ControlledHarness />)

    const trigger = page.getByRole('combobox')
    await expect.element(trigger).toHaveTextContent('Option B')

    await trigger.click()
    await page.getByRole('option', { name: 'Option B' }).click()

    expect(received).toEqual([''])
    await expect.element(trigger).toHaveTextContent('Select...')

    screen.unmount()
  })

  it('keeps the selection on re-click when deselectable is false', async () => {
    const screen = await render(
      <Select defaultValue="b" isDeselectable={false}>
        <SelectTrigger>
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
          <SelectItem value="b">Option B</SelectItem>
        </SelectContent>
      </Select>,
    )

    const trigger = page.getByRole('combobox')
    await expect.element(trigger).toHaveTextContent('Option B')

    await trigger.click()
    await page.getByRole('option', { name: 'Option B' }).click()

    // Selection is preserved; the menu just closes (Radix default behavior).
    await expect.element(trigger).toHaveTextContent('Option B')
    await expect.element(trigger).toHaveAttribute('aria-expanded', 'false')

    screen.unmount()
  })

  it('still selects a different item normally', async () => {
    const received: string[] = []

    function ControlledHarness() {
      const [value, setValue] = React.useState('')
      return (
        <Select
          value={value}
          onValueChange={(next) => {
            received.push(next)
            setValue(next)
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
            <SelectItem value="b">Option B</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    const screen = await render(<ControlledHarness />)

    const trigger = page.getByRole('combobox')
    await trigger.click()
    await page.getByRole('option', { name: 'Option A' }).click()

    expect(received).toEqual(['a'])
    await expect.element(trigger).toHaveTextContent('Option A')

    screen.unmount()
  })

  it('clears the selection via keyboard (Enter on the selected item)', async () => {
    const screen = await render(
      <Select defaultValue="b">
        <SelectTrigger>
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
          <SelectItem value="b">Option B</SelectItem>
        </SelectContent>
      </Select>,
    )

    const trigger = page.getByRole('combobox')
    await trigger.click()

    const option = page.getByRole('option', { name: 'Option B' })
    await expect.element(option).toBeVisible()
    ;(option.element() as HTMLElement).focus()
    await userEvent.keyboard('{Enter}')

    await expect.element(trigger).toHaveTextContent('Select...')

    screen.unmount()
  })

  it('clears the selection on a non-mouse activation', async () => {
    const screen = await render(
      <Select defaultValue="b">
        <SelectTrigger>
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
          <SelectItem value="b">Option B</SelectItem>
        </SelectContent>
      </Select>,
    )

    const trigger = page.getByRole('combobox')
    await trigger.click()

    // A programmatic click fires no pointer events, so it exercises the
    // non-mouse activation path (touch/pen) instead of the pointerup path.
    const option = page.getByRole('option', { name: 'Option B' })
    await expect.element(option).toBeVisible()
    ;(option.element() as HTMLElement).click()

    await expect.element(trigger).toHaveTextContent('Select...')

    screen.unmount()
  })

  it('drives controlled open + value when clearing', async () => {
    const values: string[] = []
    const opens: boolean[] = []

    function ControlledHarness() {
      const [value, setValue] = React.useState('b')
      const [open, setOpen] = React.useState(false)
      return (
        <Select
          value={value}
          onValueChange={(next) => {
            values.push(next)
            setValue(next)
          }}
          open={open}
          onOpenChange={(next) => {
            opens.push(next)
            setOpen(next)
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
            <SelectItem value="b">Option B</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    const screen = await render(<ControlledHarness />)

    const trigger = page.getByRole('combobox')
    await trigger.click()
    await page.getByRole('option', { name: 'Option B' }).click()

    expect(values).toContain('')
    expect(opens[opens.length - 1]).toBe(false)
    await expect.element(trigger).toHaveTextContent('Select...')

    screen.unmount()
  })

  it('does not clear the active item on a non-mouse activation when deselectable is false', async () => {
    const screen = await render(
      <Select defaultValue="b" isDeselectable={false}>
        <SelectTrigger>
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
          <SelectItem value="b">Option B</SelectItem>
        </SelectContent>
      </Select>,
    )

    const trigger = page.getByRole('combobox')
    await trigger.click()

    // Non-mouse activation of the active item exercises the onClick handler with
    // `isSelected` false (deselect is disabled), so the guard short-circuits and
    // requestDeselect is never reached — the selection is preserved.
    const option = page.getByRole('option', { name: 'Option B' })
    await expect.element(option).toBeVisible()
    ;(option.element() as HTMLElement).click()

    await expect.element(trigger).toHaveTextContent('Option B')

    screen.unmount()
  })

  it('does not clear the selection when a non-Enter key is pressed on the active item', async () => {
    const received: string[] = []

    function ControlledHarness() {
      const [value, setValue] = React.useState('b')
      return (
        <Select
          value={value}
          onValueChange={(next) => {
            received.push(next)
            setValue(next)
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
            <SelectItem value="b">Option B</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    const screen = await render(<ControlledHarness />)

    const trigger = page.getByRole('combobox')
    await trigger.click()

    const option = page.getByRole('option', { name: 'Option B' })
    await expect.element(option).toBeVisible()
    ;(option.element() as HTMLElement).focus()

    // A non-Enter key does not satisfy `event.key === "Enter"`, so the onKeyDown
    // guard is skipped: requestDeselect never runs and no clearing value ("") is
    // emitted.
    await userEvent.keyboard('{ArrowUp}')

    expect(received).not.toContain('')

    screen.unmount()
  })

  it('does not clear when Enter is pressed on an item that is not selected', async () => {
    const received: string[] = []

    function ControlledHarness() {
      const [value, setValue] = React.useState('b')
      return (
        <Select
          value={value}
          onValueChange={(next) => {
            received.push(next)
            setValue(next)
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
            <SelectItem value="b">Option B</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    const screen = await render(<ControlledHarness />)

    const trigger = page.getByRole('combobox')
    await trigger.click()

    const option = page.getByRole('option', { name: 'Option A' })
    await expect.element(option).toBeVisible()
    ;(option.element() as HTMLElement).focus()

    // Enter on a non-active item: `isSelected` is false so the onKeyDown guard
    // short-circuits — the item is selected normally, never deselected.
    await userEvent.keyboard('{Enter}')

    expect(received).toEqual(['a'])
    await expect.element(trigger).toHaveTextContent('Option A')

    screen.unmount()
  })
})
