import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Separator } from '@/components/ui/separator'

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

const meta = {
  title: 'BSystem/ScrollArea',
  component: ScrollArea,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ScrollArea>

export default meta
type Story = StoryObj<typeof meta>

const tags = Array.from({ length: 50 }).map((_, i) => `Tag ${i + 1}`)

// ─── Vertical ─────────────────────────────────────────────────────────────────

export const Vertical: Story = {
  render: () => (
    <ScrollArea className="h-72 w-48 rounded-lg border">
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
        {tags.map((tag) => (
          <div key={tag}>
            <p className="text-sm">{tag}</p>
            <Separator className="my-2" />
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
}

// ─── Horizontal ───────────────────────────────────────────────────────────────

export const Horizontal: Story = {
  render: () => (
    <ScrollArea className="w-96 whitespace-nowrap rounded-lg border">
      <div className="flex w-max space-x-4 p-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <figure key={i} className="shrink-0">
            <div className="overflow-hidden rounded-md">
              <div
                className="h-32 w-32 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-sm"
              >
                Photo {i + 1}
              </div>
            </div>
            <figcaption className="pt-2 text-xs text-muted-foreground">
              Image <span className="font-semibold text-foreground">{i + 1}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
}

// ─── Both Axes ────────────────────────────────────────────────────────────────

export const BothAxes: Story = {
  render: () => (
    <ScrollArea className="h-48 w-64 rounded-lg border">
      <div className="p-4" style={{ width: 500 }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <p key={i} className="text-sm py-1 whitespace-nowrap">
            Row {i + 1}: This is a long line of content that overflows horizontally
          </p>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
}
