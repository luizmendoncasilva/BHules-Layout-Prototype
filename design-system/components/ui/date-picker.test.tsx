import { ptBR } from 'date-fns/locale'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'

import { DatePicker, DateRangePicker } from './date-picker'

describe('DatePicker', () => {
  it('renders trigger button with placeholder', async () => {
    const screen = await render(<DatePicker placeholder="Selecione uma data" />)

    const trigger = page.getByRole('button', { name: 'Selecione uma data' })
    await expect.element(trigger).toBeVisible()
    await expect.element(trigger).toHaveAttribute('data-slot', 'date-picker-trigger')
    await expect.element(trigger).toHaveAttribute('data-state', 'closed')

    screen.unmount()
  })

  it('opens calendar panel with fixed positioning', async () => {
    const screen = await render(<DatePicker placeholder="Selecione uma data" />)

    const trigger = page.getByRole('button', { name: 'Selecione uma data' })
    await trigger.click()

    await expect.element(trigger).toHaveAttribute('data-state', 'open')

    const panel = page.getByRole('dialog')
    await expect.element(panel).toBeVisible()
    await expect.element(panel).toHaveAttribute('data-slot', 'date-picker-content')
    await expect.element(panel).toHaveClass(/bg-background/)
    await expect.element(panel).toHaveClass(/text-foreground/)

    const style = await panel.element().getAttribute('style')
    expect(style).toContain('position: fixed')
    expect(style).toMatch(/z-index: (9999|999999)/)

    screen.unmount()
  })

  it('does not open when disabled', async () => {
    const screen = await render(
      <DatePicker disabled placeholder="Selecione uma data" />
    )

    const trigger = page.getByRole('button', { name: 'Selecione uma data' })
    await expect.element(trigger).toHaveAttribute('disabled', '')
    await expect.element(trigger).toHaveAttribute('data-state', 'closed')

    screen.unmount()
  })

  it('closes panel on Escape', async () => {
    const screen = await render(<DatePicker placeholder="Selecione uma data" />)

    const trigger = page.getByRole('button', { name: 'Selecione uma data' })
    await trigger.click()
    await expect.element(page.getByRole('dialog')).toBeVisible()

    await userEvent.keyboard('{Escape}')
    await expect.element(trigger).toHaveAttribute('data-state', 'closed')

    screen.unmount()
  })

  it('calls onValueChange and closes panel when a date is selected', async () => {
    let received: Date | null | undefined

    const screen = await render(
      <DatePicker
        placeholder="Selecione uma data"
        onValueChange={(date) => {
          received = date
        }}
      />
    )

    const trigger = page.getByRole('button', { name: 'Selecione uma data' })
    await trigger.click()
    await expect.element(page.getByRole('dialog')).toBeVisible()

    const dayButton = document.querySelector(
      'button[data-day]'
    ) as HTMLButtonElement | null
    expect(dayButton).not.toBeNull()
    await userEvent.click(dayButton as HTMLButtonElement)

    await expect.element(trigger).toHaveAttribute('data-state', 'closed')
    expect(received).toBeInstanceOf(Date)

    screen.unmount()
  })

  it('emits null (not undefined) when the selected day is deselected', async () => {
    // Regression: emitting null keeps react-hook-form Controllers from falling
    // back to their defaultValue when a saved date is cleared (see HUB bug).
    const calls: Array<Date | null> = []
    const today = new Date()
    const value = new Date(today.getFullYear(), today.getMonth(), 15)

    const screen = await render(
      <DatePicker value={value} onValueChange={(d) => calls.push(d)} />
    )

    await page.getByRole('button').first().click()
    await expect.element(page.getByRole('dialog')).toBeVisible()

    const selectedDay = document.querySelector(
      'button[data-selected-single="true"]'
    ) as HTMLButtonElement
    await userEvent.click(selectedDay)

    expect(calls).toHaveLength(1)
    expect(calls[0]).toBeNull()

    screen.unmount()
  })

  it('renders formatted value in trigger when value is provided', async () => {
    const value = new Date(2024, 0, 15)

    const screen = await render(
      <DatePicker value={value} dateFormat="LLL dd, y" />
    )

    // No locale passed: the default is pt-BR, so the month renders as "jan".
    const trigger = page.getByRole('button', { name: /jan 15, 2024/ })
    await expect.element(trigger).toBeVisible()

    screen.unmount()
  })

  it('formats the trigger value with the provided locale', async () => {
    const value = new Date(2024, 0, 15)

    const screen = await render(
      <DatePicker value={value} dateFormat="PPP" locale={ptBR} />
    )

    // Exercises the `locale` branch of formatDate: with "PPP" the month name is
    // spelled out, so "15 de janeiro de 2024" proves the locale reaches the
    // trigger label (here pt-BR, which is also the default).
    const trigger = page.getByRole('button', { name: /15 de janeiro de 2024/ })
    await expect.element(trigger).toBeVisible()

    screen.unmount()
  })

  it('renders month and year dropdowns by default', async () => {
    const screen = await render(<DatePicker placeholder="Selecione uma data" />)

    const trigger = page.getByRole('button', { name: 'Selecione uma data' })
    await trigger.click()
    await expect.element(page.getByRole('dialog')).toBeVisible()

    expect(document.querySelectorAll('select')).toHaveLength(2)

    screen.unmount()
  })

  it('honors captionLayout="label" to render a static header (no dropdowns)', async () => {
    const screen = await render(
      <DatePicker placeholder="Selecione uma data" captionLayout="label" />
    )

    const trigger = page.getByRole('button', { name: 'Selecione uma data' })
    await trigger.click()
    await expect.element(page.getByRole('dialog')).toBeVisible()

    expect(document.querySelectorAll('select')).toHaveLength(0)

    screen.unmount()
  })

  it('bounds the year dropdown to [startMonth, endMonth]', async () => {
    const screen = await render(
      <DatePicker
        placeholder="Selecione uma data"
        captionLayout="dropdown"
        startMonth={new Date(2000, 0)}
        endMonth={new Date(2010, 11)}
      />
    )

    const trigger = page.getByRole('button', { name: 'Selecione uma data' })
    await trigger.click()
    await expect.element(page.getByRole('dialog')).toBeVisible()

    const yearSelect = document.querySelectorAll('select')[1] as HTMLSelectElement
    const years = Array.from(yearSelect.options).map((o) => Number(o.value))
    expect(Math.min(...years)).toBe(2000)
    expect(Math.max(...years)).toBe(2010)

    screen.unmount()
  })

  it('navigates the calendar when a year is chosen from the dropdown', async () => {
    const screen = await render(
      <DatePicker
        placeholder="Selecione uma data"
        captionLayout="dropdown"
        startMonth={new Date(1990, 0)}
        endMonth={new Date(2030, 11)}
      />
    )

    const trigger = page.getByRole('button', { name: 'Selecione uma data' })
    await trigger.click()
    await expect.element(page.getByRole('dialog')).toBeVisible()

    const yearSelect = document.querySelectorAll('select')[1] as HTMLSelectElement
    await userEvent.selectOptions(yearSelect, '2000')

    const days = Array.from(
      document.querySelectorAll('button[data-day]')
    ) as HTMLButtonElement[]
    expect(days.length).toBeGreaterThan(0)
    expect(
      days.some((d) => (d.getAttribute('data-day') ?? '').includes('2000'))
    ).toBe(true)

    screen.unmount()
  })

  it('localizes month dropdown labels via the locale prop', async () => {
    const screen = await render(
      <DatePicker
        placeholder="Selecione uma data"
        captionLayout="dropdown"
        locale={ptBR}
        startMonth={new Date(2020, 0)}
        endMonth={new Date(2020, 11)}
      />
    )

    const trigger = page.getByRole('button', { name: 'Selecione uma data' })
    await trigger.click()
    await expect.element(page.getByRole('dialog')).toBeVisible()

    const monthSelect = document.querySelectorAll('select')[0] as HTMLSelectElement
    const labels = Array.from(monthSelect.options).map((o) =>
      (o.textContent ?? '').toLowerCase()
    )
    // pt-BR short month names: "fev." (fevereiro), "mai." (maio)
    expect(labels.some((l) => l.includes('fev'))).toBe(true)
    expect(labels.some((l) => l.includes('mai'))).toBe(true)

    screen.unmount()
  })

  it('disables dates matched by disabledDates', async () => {
    // Bounding to Jun 2024 makes the displayed month deterministic: today is
    // far past endMonth, so react-day-picker clamps the initial month to it.
    const screen = await render(
      <DatePicker
        placeholder="Selecione uma data"
        captionLayout="dropdown"
        startMonth={new Date(2024, 0, 1)}
        endMonth={new Date(2024, 5, 30)}
        disabledDates={{ after: new Date(2024, 5, 20) }}
      />
    )

    const trigger = page.getByRole('button', { name: 'Selecione uma data' })
    await trigger.click()
    await expect.element(page.getByRole('dialog')).toBeVisible()

    // 25 Jun 2024 is after the cutoff, so it must be disabled.
    const targetDay = new Date(2024, 5, 25).toLocaleDateString()
    const dayButton = document.querySelector(
      `button[data-day="${targetDay}"]`
    ) as HTMLButtonElement | null
    expect(dayButton).not.toBeNull()
    expect(
      dayButton?.hasAttribute('disabled') ||
        dayButton?.getAttribute('aria-disabled') === 'true'
    ).toBe(true)

    screen.unmount()
  })
})

describe('DateRangePicker', () => {
  it('renders trigger button with placeholder', async () => {
    const screen = await render(
      <DateRangePicker placeholder="Selecione um período" />
    )

    const trigger = page.getByRole('button', { name: 'Selecione um período' })
    await expect.element(trigger).toBeVisible()
    await expect.element(trigger).toHaveAttribute(
      'data-slot',
      'date-range-picker-trigger'
    )
    await expect.element(trigger).toHaveAttribute('data-state', 'closed')

    screen.unmount()
  })

  it('opens range calendar panel on click', async () => {
    const screen = await render(
      <DateRangePicker placeholder="Selecione um período" />
    )

    const trigger = page.getByRole('button', { name: 'Selecione um período' })
    await trigger.click()

    await expect.element(trigger).toHaveAttribute('data-state', 'open')
    await expect.element(page.getByRole('dialog')).toBeVisible()

    screen.unmount()
  })

  it('renders formatted range when both from and to are provided', async () => {
    const from = new Date(2024, 0, 10)
    const to = new Date(2024, 0, 20)

    const screen = await render(
      <DateRangePicker value={{ from, to }} />
    )

    const trigger = page.getByRole('button', {
      name: /jan 10, 2024.*jan 20, 2024/,
    })
    await expect.element(trigger).toBeVisible()

    screen.unmount()
  })

  it('renders only "from" date when "to" is missing', async () => {
    const from = new Date(2024, 0, 10)

    const screen = await render(
      <DateRangePicker value={{ from, to: undefined }} />
    )

    const trigger = page.getByRole('button', { name: /jan 10, 2024/ })
    await expect.element(trigger).toBeVisible()

    const text = (await trigger.element().textContent) ?? ''
    expect(text).not.toContain('–')

    screen.unmount()
  })

  it('calls onValueChange when a range day is selected', async () => {
    // Exercises the range onSelect handler (covers the orNull call on the range
    // path; the null branch of orNull is covered by the single picker tests).
    const calls: unknown[] = []
    const today = new Date()
    const value = {
      from: new Date(today.getFullYear(), today.getMonth(), 10),
      to: new Date(today.getFullYear(), today.getMonth(), 20),
    }

    const screen = await render(
      <DateRangePicker value={value} onValueChange={(r) => calls.push(r)} />
    )

    await page.getByRole('button').first().click()
    await expect.element(page.getByRole('dialog')).toBeVisible()

    const day15 = Array.from(
      document.querySelectorAll<HTMLButtonElement>('button[data-day]')
    ).find((b) => b.textContent?.trim() === '15')
    await userEvent.click(day15 as HTMLButtonElement)

    expect(calls.length).toBeGreaterThan(0)
    expect(calls[0]).not.toBeNull()

    screen.unmount()
  })

  it('does not open when disabled', async () => {
    const screen = await render(
      <DateRangePicker disabled placeholder="Selecione um período" />
    )

    const trigger = page.getByRole('button', { name: 'Selecione um período' })
    await expect.element(trigger).toHaveAttribute('disabled', '')
    await expect.element(trigger).toHaveAttribute('data-state', 'closed')

    screen.unmount()
  })

  it('renders month/year dropdowns when captionLayout="dropdown"', async () => {
    const screen = await render(
      <DateRangePicker
        placeholder="Selecione um período"
        captionLayout="dropdown"
      />
    )

    const trigger = page.getByRole('button', { name: 'Selecione um período' })
    await trigger.click()
    await expect.element(page.getByRole('dialog')).toBeVisible()

    // Two months are shown, each with its own month + year dropdown.
    expect(document.querySelectorAll('select').length).toBeGreaterThanOrEqual(2)

    screen.unmount()
  })
})
