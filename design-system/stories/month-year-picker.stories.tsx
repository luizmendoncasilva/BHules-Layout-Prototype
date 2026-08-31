'use client'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import * as React from 'react'

import { MonthYearPicker } from '@/components/ui/month-year-picker'

const meta = {
  title: 'BSystem/MonthYearPicker',
  component: MonthYearPicker,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof MonthYearPicker>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => {
    const [value, setValue] = React.useState<Date | undefined>()
    return <MonthYearPicker value={value} onValueChange={setValue} />
  },
}

export const PreSelected: Story = {
  render: () => {
    const [value, setValue] = React.useState<Date | undefined>(
      new Date(2026, 0, 1)
    )
    return <MonthYearPicker value={value} onValueChange={setValue} />
  },
}

export const QuickYearJump: Story = {
  render: () => {
    const [value, setValue] = React.useState<Date | undefined>()
    return <MonthYearPicker value={value} onValueChange={setValue} />
  },
  parameters: {
    docs: {
      description: {
        story:
          'O cabeçalho traz um **dropdown de ano** (além das setas ‹ › para ' +
          'ajuste fino de ±1 ano), permitindo saltar rapidamente entre anos ' +
          'distantes. Sem `min`/`max`, o intervalo padrão é ' +
          '`today − 100 anos … today + 10 anos`.',
      },
    },
  },
}

export const MinMax: Story = {
  render: () => {
    const today = new Date()
    const min = new Date(today.getFullYear() - 1, today.getMonth(), 1)
    const max = new Date(today.getFullYear(), today.getMonth(), 1)
    const [value, setValue] = React.useState<Date | undefined>()
    return (
      <div className="flex flex-col gap-3">
        <span className="text-xs text-muted-foreground font-medium">
          Últimos 13 meses (até hoje)
        </span>
        <MonthYearPicker
          value={value}
          onValueChange={setValue}
          min={min}
          max={max}
        />
      </div>
    )
  },
}

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <MonthYearPicker disabled />
      <MonthYearPicker value={new Date(2026, 4, 1)} disabled />
    </div>
  ),
}

export const EnglishLocale: Story = {
  render: () => {
    const [value, setValue] = React.useState<Date | undefined>(
      new Date(2026, 5, 1)
    )
    return (
      <MonthYearPicker
        value={value}
        onValueChange={setValue}
        locale="en-US"
        placeholder="Select month and year"
      />
    )
  },
}
