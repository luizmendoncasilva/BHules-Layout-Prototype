'use client'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import * as React from 'react'
import type { DateRange } from 'react-day-picker'

import { DatePicker, DateRangePicker } from '@/components/ui/date-picker'

const meta = {
  title: 'BSystem/DatePicker',
  component: DatePicker,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof DatePicker>

export default meta
type Story = StoryObj<typeof meta>

// ─── Single – Default ─────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => {
    const [date, setDate] = React.useState<Date | null>()
    return <DatePicker value={date} onValueChange={setDate} />
  },
}

// ─── Single – Pre-selected ────────────────────────────────────────────────────

export const PreSelected: Story = {
  render: () => {
    const [date, setDate] = React.useState<Date | null>(new Date(2025, 0, 20))
    return <DatePicker value={date} onValueChange={setDate} />
  },
}

// ─── Single – Custom Format ───────────────────────────────────────────────────

export const CustomFormat: Story = {
  render: () => {
    const [date, setDate] = React.useState<Date | null>(new Date())
    return (
      <div className="flex flex-col gap-3">
        <DatePicker value={date} onValueChange={setDate} dateFormat="dd/MM/yyyy" />
        <DatePicker value={date} onValueChange={setDate} dateFormat="MMM d, yyyy" />
        <DatePicker value={date} onValueChange={setDate} dateFormat="yyyy-MM-dd" />
      </div>
    )
  },
}

// ─── Single – Label header (opt-out) ──────────────────────────────────────────

export const LabelHeader: Story = {
  render: () => {
    const [date, setDate] = React.useState<Date | null>()
    return (
      <DatePicker value={date} onValueChange={setDate} captionLayout="label" />
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          'Cabeçalho estático com mês/ano em texto e navegação apenas por setas ' +
          '(`captionLayout="label"`). Útil quando os dropdowns não agregam — ex.: ' +
          'datas próximas, onde o usuário só avança alguns meses.',
      },
    },
  },
}

// ─── Single – Disabled ────────────────────────────────────────────────────────

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <DatePicker disabled />
      <DatePicker value={new Date(2025, 0, 20)} disabled />
    </div>
  ),
}

// ─── Range – Default ──────────────────────────────────────────────────────────

export const RangeDefault: Story = {
  render: () => {
    const [range, setRange] = React.useState<DateRange | null>()
    return <DateRangePicker value={range} onValueChange={setRange} />
  },
}

// ─── Range – Pre-selected ─────────────────────────────────────────────────────

export const RangePreSelected: Story = {
  render: () => {
    const [range, setRange] = React.useState<DateRange | null>({
      from: new Date(2025, 0, 15),
      to: new Date(2025, 0, 28),
    })
    return <DateRangePicker value={range} onValueChange={setRange} />
  },
}

// ─── Range – Disabled ─────────────────────────────────────────────────────────

export const RangeDisabled: Story = {
  render: () => <DateRangePicker disabled />,
}

// ─── Both Pickers Side by Side ────────────────────────────────────────────────

export const BothPickers: Story = {
  render: () => {
    const [date, setDate] = React.useState<Date | null>()
    const [range, setRange] = React.useState<DateRange | null>()
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground font-medium">Single date</span>
          <DatePicker value={date} onValueChange={setDate} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground font-medium">Date range</span>
          <DateRangePicker value={range} onValueChange={setRange} />
        </div>
      </div>
    )
  },
}
