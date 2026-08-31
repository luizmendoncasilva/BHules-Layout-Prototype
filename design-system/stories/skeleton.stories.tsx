import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Skeleton } from '@/components/ui/skeleton'

const meta = {
  title: 'BSystem/Skeleton',
  component: Skeleton,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

// ─── Playground ──────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: () => <Skeleton className="h-4 w-48" />,
}

// ─── Text Lines ──────────────────────────────────────────────────────────────

export const TextLines: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-64">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  ),
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

export const Avatar: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Skeleton className="size-10 rounded-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  ),
}

// ─── Card ────────────────────────────────────────────────────────────────────

export const Card: Story = {
  render: () => (
    <div className="w-72 rounded-lg border border-border p-4 flex flex-col gap-4">
      <Skeleton className="h-36 w-full rounded-lg" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>
    </div>
  ),
}

// ─── List ────────────────────────────────────────────────────────────────────

export const List: Story = {
  render: () => (
    <div className="w-64 flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-full shrink-0" />
          <div className="flex flex-col gap-1.5 flex-1">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  ),
}
