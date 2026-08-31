import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Progress } from '@/components/ui/progress'

const meta = {
  title: 'BSystem/Progress',
  component: Progress,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Progress>

export default meta
type Story = StoryObj<typeof meta>

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: () => <Progress value={60} className="w-80" />,
}

// ─── Values ───────────────────────────────────────────────────────────────────

export const Values: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      {[0, 25, 50, 75, 100].map((value) => (
        <div key={value} className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{value}%</span>
          </div>
          <Progress value={value} />
        </div>
      ))}
    </div>
  ),
}

// ─── File Upload ──────────────────────────────────────────────────────────────

export const FileUpload: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-80">
      <div className="flex justify-between text-sm">
        <span className="font-medium">Uploading report.pdf</span>
        <span className="text-muted-foreground">68%</span>
      </div>
      <Progress value={68} />
      <p className="text-xs text-muted-foreground">3.4 MB of 5 MB uploaded</p>
    </div>
  ),
}

// ─── Animated ─────────────────────────────────────────────────────────────────

export const Animated: Story = {
  render: () => {
    const [value, setValue] = React.useState(13)

    React.useEffect(() => {
      const timer = setInterval(() => {
        setValue((prev) => {
          if (prev >= 100) {
            clearInterval(timer)
            return 100
          }
          return prev + 5
        })
      }, 300)
      return () => clearInterval(timer)
    }, [])

    return (
      <div className="flex flex-col gap-2 w-80">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Loading resources…</span>
          <span className="text-muted-foreground">{value}%</span>
        </div>
        <Progress value={value} />
      </div>
    )
  },
}
