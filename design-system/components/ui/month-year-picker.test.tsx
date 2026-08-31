import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'

import { MonthYearPicker } from './month-year-picker'

function queryMonthButton(monthIndex: number) {
  return document.querySelector<HTMLButtonElement>(
    `[data-month="${monthIndex}"]`
  )
}

function getYearLabelText(): string {
  const el = document.querySelector('[data-slot="month-year-picker-year"]')
  return el?.textContent ?? ''
}

describe('MonthYearPicker', () => {
  it('renders trigger button with default placeholder', async () => {
    const screen = await render(<MonthYearPicker />)

    const trigger = page.getByRole('button', { name: 'Selecione mês e ano' })
    await expect.element(trigger).toBeVisible()
    await expect
      .element(trigger)
      .toHaveAttribute('data-slot', 'month-year-picker-trigger')
    await expect.element(trigger).toHaveAttribute('aria-expanded', 'false')

    screen.unmount()
  })

  it('opens popover on click and reveals month grid', async () => {
    const screen = await render(<MonthYearPicker />)

    const trigger = page.getByRole('button', { name: 'Selecione mês e ano' })
    await trigger.click()
    await expect.element(trigger).toHaveAttribute('aria-expanded', 'true')

    await expect
      .element(page.getByRole('button', { name: 'Ano anterior' }))
      .toBeVisible()
    await expect
      .element(page.getByRole('button', { name: 'Próximo ano' }))
      .toBeVisible()

    screen.unmount()
  })

  it('renders formatted "Mês de Ano" in trigger when value is provided', async () => {
    const screen = await render(
      <MonthYearPicker value={new Date(2026, 0, 1)} />
    )

    const trigger = page.getByRole('button', { name: 'Janeiro de 2026' })
    await expect.element(trigger).toBeVisible()

    screen.unmount()
  })

  it('respects locale prop for trigger label', async () => {
    const screen = await render(
      <MonthYearPicker value={new Date(2026, 5, 1)} locale="en-US" />
    )

    const trigger = page.getByRole('button', { name: /June 2026/ })
    await expect.element(trigger).toBeVisible()

    screen.unmount()
  })

  it('calls onValueChange when controlled and a month is selected', async () => {
    const received: Date[] = []

    function ControlledHarness() {
      const [date, setDate] = React.useState<Date | undefined>(
        new Date(2026, 0, 1) // January
      )
      return (
        <MonthYearPicker
          value={date}
          onValueChange={(d) => {
            if (d) received.push(d)
            setDate(d)
          }}
        />
      )
    }

    const screen = await render(<ControlledHarness />)

    await page.getByRole('button', { name: /Janeiro de 2026/ }).click()

    const julyButton = queryMonthButton(6)
    expect(julyButton).not.toBeNull()
    await userEvent.click(julyButton as HTMLButtonElement)

    expect(received).toHaveLength(1)
    expect(received[0].getMonth()).toBe(6)
    await expect
      .element(page.getByRole('button', { name: /Julho de 2026/i }))
      .toHaveAttribute('aria-expanded', 'false')

    screen.unmount()
  })

  it('calls onValueChange and closes when a month is selected', async () => {
    let received: Date | undefined

    const screen = await render(
      <MonthYearPicker
        onValueChange={(date) => {
          received = date
        }}
      />
    )

    await page.getByRole('button', { name: 'Selecione mês e ano' }).click()

    const marchButton = queryMonthButton(2)
    expect(marchButton).not.toBeNull()
    await userEvent.click(marchButton as HTMLButtonElement)

    await expect
      .element(page.getByRole('button', { name: /Março de 2026/i }))
      .toHaveAttribute('aria-expanded', 'false')
    expect(received).toBeInstanceOf(Date)
    expect(received?.getMonth()).toBe(2)

    screen.unmount()
  })

  it('does not open when disabled', async () => {
    const screen = await render(<MonthYearPicker disabled />)

    const trigger = page.getByRole('button', { name: 'Selecione mês e ano' })
    await expect.element(trigger).toHaveAttribute('disabled', '')
    await expect.element(trigger).toHaveAttribute('aria-expanded', 'false')

    screen.unmount()
  })

  it('disables months outside the [min, max] range', async () => {
    const screen = await render(
      <MonthYearPicker
        defaultValue={new Date(2026, 5, 1)}
        min={new Date(2026, 2, 1)} // March
        max={new Date(2026, 8, 1)} // September
      />
    )

    const trigger = page.getByRole('button')
    await trigger.click()

    const january = queryMonthButton(0)
    const march = queryMonthButton(2)
    const september = queryMonthButton(8)
    const december = queryMonthButton(11)

    expect(january?.hasAttribute('disabled')).toBe(true)
    expect(march?.hasAttribute('disabled')).toBe(false)
    expect(september?.hasAttribute('disabled')).toBe(false)
    expect(december?.hasAttribute('disabled')).toBe(true)

    screen.unmount()
  })

  it('navigates between years via chevron buttons', async () => {
    const screen = await render(
      <MonthYearPicker defaultValue={new Date(2026, 0, 1)} />
    )

    await page.getByRole('button', { name: 'Janeiro de 2026' }).click()
    expect(getYearLabelText()).toBe('2026')

    await page.getByRole('button', { name: 'Próximo ano' }).click()
    expect(getYearLabelText()).toBe('2027')

    await page.getByRole('button', { name: 'Ano anterior' }).click()
    await page.getByRole('button', { name: 'Ano anterior' }).click()
    expect(getYearLabelText()).toBe('2025')

    screen.unmount()
  })

  it('jumps years quickly via the year dropdown and selects within that year', async () => {
    const received: Date[] = []

    const screen = await render(
      <MonthYearPicker
        defaultValue={new Date(2026, 0, 1)}
        onValueChange={(d) => {
          if (d) received.push(d)
        }}
      />
    )

    await page.getByRole('button', { name: 'Janeiro de 2026' }).click()
    expect(getYearLabelText()).toBe('2026')

    const yearSelect = document.querySelector(
      '[data-slot="month-year-picker-year-select"]'
    ) as HTMLSelectElement | null
    expect(yearSelect).not.toBeNull()
    await userEvent.selectOptions(yearSelect as HTMLSelectElement, '1990')

    // The view jumps straight to 1990 (no arrow clicking needed).
    expect(getYearLabelText()).toBe('1990')

    // Selecting a month now returns a date in the chosen year.
    const marchButton = queryMonthButton(2)
    await userEvent.click(marchButton as HTMLButtonElement)
    expect(received).toHaveLength(1)
    expect(received[0].getFullYear()).toBe(1990)
    expect(received[0].getMonth()).toBe(2)

    screen.unmount()
  })

  it('disables year navigation at min/max year boundaries', async () => {
    const screen = await render(
      <MonthYearPicker
        defaultValue={new Date(2026, 5, 1)}
        min={new Date(2026, 0, 1)}
        max={new Date(2026, 11, 1)}
      />
    )

    await page.getByRole('button', { name: /Junho de 2026/ }).click()

    const prevYear = page.getByRole('button', { name: 'Ano anterior' })
    const nextYear = page.getByRole('button', { name: 'Próximo ano' })

    await expect.element(prevYear).toBeDisabled()
    await expect.element(nextYear).toBeDisabled()

    screen.unmount()
  })

  // ─── Keyboard navigation ────────────────────────────────────────────────────

  function activeMonthIndex(): string | null {
    return document.activeElement?.getAttribute('data-month') ?? null
  }

  it('moves focus horizontally with ArrowLeft/ArrowRight', async () => {
    const screen = await render(
      <MonthYearPicker defaultValue={new Date(2026, 5, 1)} />
    )
    await page.getByRole('button', { name: /Junho de 2026/ }).click()
    expect(activeMonthIndex()).toBe('5')

    await userEvent.keyboard('{ArrowRight}')
    expect(activeMonthIndex()).toBe('6')

    await userEvent.keyboard('{ArrowLeft}')
    expect(activeMonthIndex()).toBe('5')

    screen.unmount()
  })

  it('moves focus vertically (one row = 4 months) with ArrowDown/ArrowUp', async () => {
    const screen = await render(
      <MonthYearPicker defaultValue={new Date(2026, 1, 1)} />
    )
    await page.getByRole('button', { name: /Fevereiro de 2026/ }).click()
    expect(activeMonthIndex()).toBe('1')

    await userEvent.keyboard('{ArrowDown}')
    expect(activeMonthIndex()).toBe('5')

    await userEvent.keyboard('{ArrowUp}')
    expect(activeMonthIndex()).toBe('1')

    screen.unmount()
  })

  it('jumps to first/last month with Home/End', async () => {
    const screen = await render(
      <MonthYearPicker defaultValue={new Date(2026, 5, 1)} />
    )
    await page.getByRole('button', { name: /Junho de 2026/ }).click()

    await userEvent.keyboard('{Home}')
    expect(activeMonthIndex()).toBe('0')

    await userEvent.keyboard('{End}')
    expect(activeMonthIndex()).toBe('11')

    screen.unmount()
  })

  it('clamps arrow navigation at grid edges', async () => {
    const screen = await render(
      <MonthYearPicker defaultValue={new Date(2026, 0, 1)} />
    )
    await page.getByRole('button', { name: /Janeiro de 2026/ }).click()

    await userEvent.keyboard('{ArrowLeft}')
    expect(activeMonthIndex()).toBe('0')

    await userEvent.keyboard('{ArrowUp}')
    expect(activeMonthIndex()).toBe('0')

    await userEvent.keyboard('{End}')
    expect(activeMonthIndex()).toBe('11')

    await userEvent.keyboard('{ArrowRight}')
    expect(activeMonthIndex()).toBe('11')

    await userEvent.keyboard('{ArrowDown}')
    expect(activeMonthIndex()).toBe('11')

    screen.unmount()
  })

  it('changes year via PageDown/PageUp', async () => {
    const screen = await render(
      <MonthYearPicker defaultValue={new Date(2026, 5, 1)} />
    )
    await page.getByRole('button', { name: /Junho de 2026/ }).click()
    expect(getYearLabelText()).toBe('2026')

    await userEvent.keyboard('{PageDown}')
    expect(getYearLabelText()).toBe('2027')

    await userEvent.keyboard('{PageUp}')
    await userEvent.keyboard('{PageUp}')
    expect(getYearLabelText()).toBe('2025')

    screen.unmount()
  })

  it('blocks PageUp/PageDown at min/max year boundaries', async () => {
    const screen = await render(
      <MonthYearPicker
        defaultValue={new Date(2026, 5, 1)}
        min={new Date(2026, 0, 1)}
        max={new Date(2026, 11, 1)}
      />
    )
    await page.getByRole('button', { name: /Junho de 2026/ }).click()
    expect(getYearLabelText()).toBe('2026')

    await userEvent.keyboard('{PageDown}')
    expect(getYearLabelText()).toBe('2026')

    await userEvent.keyboard('{PageUp}')
    expect(getYearLabelText()).toBe('2026')

    screen.unmount()
  })

  it('ignores unrelated keys (default branch)', async () => {
    const screen = await render(
      <MonthYearPicker defaultValue={new Date(2026, 5, 1)} />
    )
    await page.getByRole('button', { name: /Junho de 2026/ }).click()
    const before = activeMonthIndex()

    await userEvent.keyboard('a')
    expect(activeMonthIndex()).toBe(before)

    screen.unmount()
  })
})
