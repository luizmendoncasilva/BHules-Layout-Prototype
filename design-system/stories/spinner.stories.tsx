import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'

const meta = {
  title: 'BSystem/Spinner',
  component: Spinner,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'default', 'lg', 'xl'],
    },
  },
  args: {
    size: 'default',
  },
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

// ─── Playground ──────────────────────────────────────────────────────────────

export const Playground: Story = {}

// ─── Sizes ───────────────────────────────────────────────────────────────────

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      {(['xs', 'sm', 'default', 'lg', 'xl'] as const).map((size) => (
        <div key={size} className="flex flex-col items-center gap-3">
          <Spinner size={size} />
          <span className="text-xs text-muted-foreground">{size}</span>
        </div>
      ))}
    </div>
  ),
}

// ─── Color Inheritance ───────────────────────────────────────────────────────

export const ColorInheritance: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <Spinner className="text-foreground" />
        <span className="text-xs text-muted-foreground">foreground</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner className="text-muted-foreground" />
        <span className="text-xs text-muted-foreground">muted</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner className="text-primary" />
        <span className="text-xs text-muted-foreground">primary</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner className="text-destructive" />
        <span className="text-xs text-muted-foreground">destructive</span>
      </div>
    </div>
  ),
}

// ─── In Buttons ──────────────────────────────────────────────────────────────

export const InButtons: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="default" disabled>
        <Spinner size="sm" />
        Loading…
      </Button>
      <Button variant="secondary" disabled>
        <Spinner size="sm" />
        Saving…
      </Button>
      <Button variant="outline" disabled>
        <Spinner size="sm" />
        Processing…
      </Button>
      <Button variant="destructive" disabled>
        <Spinner size="sm" />
        Deleting…
      </Button>
    </div>
  ),
}

// ─── Standalone Overlay ───────────────────────────────────────────────────────

export const StandaloneOverlay: Story = {
  render: () => (
    <div className="relative w-64 h-32 rounded-lg border border-border flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
        <Spinner size="xl" className="text-muted-foreground" />
      </div>
    </div>
  ),
}
