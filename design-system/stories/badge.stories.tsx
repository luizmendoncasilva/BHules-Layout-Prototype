import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { CircleCheckIcon, StarIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

const meta = {
  title: 'BSystem/Badge',
  component: Badge,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'outline', 'ghost', 'destructive', 'success', 'warning', 'info'],
    },
  },
  args: {
    children: 'Badge',
    variant: 'default',
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

// ─── Playground ──────────────────────────────────────────────────────────────

export const Playground: Story = {}

// ─── Variants ────────────────────────────────────────────────────────────────

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="ghost">Ghost</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  ),
}

// ─── With Icon ───────────────────────────────────────────────────────────────

export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="default">
        <CircleCheckIcon />
        Default
      </Badge>
      <Badge variant="secondary">
        <CircleCheckIcon />
        Secondary
      </Badge>
      <Badge variant="outline">
        <StarIcon />
        Outline
      </Badge>
      <Badge variant="destructive">
        <CircleCheckIcon />
        Destructive
      </Badge>
    </div>
  ),
}

// ─── As Link ─────────────────────────────────────────────────────────────────

export const AsLink: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge asChild variant="default">
        <a href="#">Default Link</a>
      </Badge>
      <Badge asChild variant="outline">
        <a href="#">Outline Link</a>
      </Badge>
    </div>
  ),
}
