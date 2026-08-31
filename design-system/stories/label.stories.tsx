import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Label } from '@/components/ui/label'

const meta = {
  title: 'BSystem/Label',
  component: Label,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    children: 'Label text',
  },
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

// ─── Playground ──────────────────────────────────────────────────────────────

export const Playground: Story = {}

// ─── With Input ──────────────────────────────────────────────────────────────

export const WithInput: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email address</Label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-[3px] focus:ring-ring focus:border-ring"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Full name</Label>
        <input
          id="name"
          type="text"
          placeholder="Arthur Moreira"
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-[3px] focus:ring-ring focus:border-ring"
        />
      </div>
    </div>
  ),
}

// ─── Disabled ────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5">
      <div className="group" data-disabled="true">
        <Label>Disabled label</Label>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="disabled-input" className="peer-disabled:opacity-50 peer-disabled:cursor-not-allowed">
          Disabled via peer
        </Label>
        <input
          id="disabled-input"
          type="text"
          disabled
          placeholder="Disabled input"
          className="peer h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  ),
}

// ─── Required ────────────────────────────────────────────────────────────────

export const Required: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="required-input">
        Email address
        <span className="text-destructive ml-0.5">*</span>
      </Label>
      <input
        id="required-input"
        type="email"
        required
        placeholder="you@example.com"
        className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-[3px] focus:ring-ring focus:border-ring"
      />
    </div>
  ),
}
