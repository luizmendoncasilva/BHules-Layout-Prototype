import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Separator } from '@/components/ui/separator'

const meta = {
  title: 'BSystem/Separator',
  component: Separator,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
    decorative: { control: 'boolean' },
  },
  args: {
    orientation: 'horizontal',
    decorative: true,
  },
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

// ─── Playground ──────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => (
    <div className="w-64">
      <Separator {...args} />
    </div>
  ),
}

// ─── Horizontal ──────────────────────────────────────────────────────────────

export const Horizontal: Story = {
  render: () => (
    <div className="w-64 flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">Section A</p>
        <p className="text-xs text-muted-foreground">Some content above</p>
      </div>
      <Separator />
      <div>
        <p className="text-sm font-medium text-foreground">Section B</p>
        <p className="text-xs text-muted-foreground">Some content below</p>
      </div>
    </div>
  ),
}

// ─── Vertical ────────────────────────────────────────────────────────────────

export const Vertical: Story = {
  render: () => (
    <div className="flex items-center h-8 gap-4">
      <span className="text-sm text-foreground">Home</span>
      <Separator orientation="vertical" />
      <span className="text-sm text-foreground">Docs</span>
      <Separator orientation="vertical" />
      <span className="text-sm text-foreground">Blog</span>
    </div>
  ),
}

// ─── In Menu ─────────────────────────────────────────────────────────────────

export const InMenu: Story = {
  render: () => (
    <div className="w-48 rounded-lg border border-border bg-background shadow-sm p-1 flex flex-col gap-0.5">
      <button className="w-full text-left px-3 py-1.5 text-sm rounded-md text-foreground hover:bg-accent">
        Edit
      </button>
      <button className="w-full text-left px-3 py-1.5 text-sm rounded-md text-foreground hover:bg-accent">
        Duplicate
      </button>
      <div className="py-1">
        <Separator />
      </div>
      <button className="w-full text-left px-3 py-1.5 text-sm rounded-md text-destructive hover:bg-accent">
        Delete
      </button>
    </div>
  ),
}
