import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { DateRange } from 'react-day-picker'

import { Calendar } from '@/components/ui/calendar'

const meta = {
  title: 'BSystem/Calendar',
  component: Calendar,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Calendar>

export default meta
type Story = StoryObj<typeof meta>

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => {
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-lg border"
      />
    )
  },
}

// ─── No Selection ─────────────────────────────────────────────────────────────

export const NoSelection: Story = {
  render: () => (
    <Calendar mode="single" className="rounded-lg border" />
  ),
}

// ─── Range Selection ──────────────────────────────────────────────────────────

export const RangeSelection: Story = {
  render: () => {
    const [range, setRange] = React.useState<DateRange | undefined>({
      from: new Date(2025, 0, 10),
      to: new Date(2025, 0, 20),
    })
    return (
      <Calendar
        mode="range"
        selected={range}
        onSelect={setRange}
        className="rounded-lg border"
      />
    )
  },
}

// ─── Multiple Months ──────────────────────────────────────────────────────────

export const MultipleMonths: Story = {
  render: () => {
    const [range, setRange] = React.useState<DateRange | undefined>()
    return (
      <Calendar
        mode="range"
        selected={range}
        onSelect={setRange}
        numberOfMonths={2}
        className="rounded-lg border"
      />
    )
  },
}

// ─── Dropdown Caption ─────────────────────────────────────────────────────────

export const DropdownCaption: Story = {
  render: () => {
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        captionLayout="dropdown"
        className="rounded-lg border"
      />
    )
  },
}

// ─── With Disabled Dates ──────────────────────────────────────────────────────

export const WithDisabledDates: Story = {
  render: () => {
    const [date, setDate] = React.useState<Date | undefined>()
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        disabled={[
          { dayOfWeek: [0, 6] }, // weekends
          { before: new Date() }, // past dates
        ]}
        className="rounded-lg border"
      />
    )
  },
}
