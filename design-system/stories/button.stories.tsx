import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { PlusIcon, Trash2Icon, SearchIcon, EditIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

const meta = {
  title: 'BSystem/Button',
  component: Button,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'outline', 'ghost', 'destructive', 'info', 'warning', 'success'],
    },
    size: {
      control: 'select',
      options: ['default', 'lg', 'sm', 'xs', 'icon', 'icon-lg', 'icon-sm', 'icon-xs'],
    },
    disabled: { control: 'boolean' },
  },
  args: {
    children: 'Button',
    variant: 'default',
    size: 'default',
    disabled: false,
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

// ─── Playground ──────────────────────────────────────────────────────────────

export const Playground: Story = {}

// ─── Variants ────────────────────────────────────────────────────────────────

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="info">Info</Button>
      <Button variant="warning">Warning</Button>
      <Button variant="success">Success</Button>
    </div>
  ),
}

// ─── Sizes ───────────────────────────────────────────────────────────────────

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-3">
      <Button size="xs">Mini</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
}

// ─── Icon Buttons ─────────────────────────────────────────────────────────────

export const IconButtons: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-3">
      <Button size="icon-xs" variant="outline" aria-label="Search xs">
        <SearchIcon />
      </Button>
      <Button size="icon-sm" variant="outline" aria-label="Search sm">
        <SearchIcon />
      </Button>
      <Button size="icon" variant="outline" aria-label="Search default">
        <SearchIcon />
      </Button>
      <Button size="icon-lg" variant="outline" aria-label="Search lg">
        <SearchIcon />
      </Button>
    </div>
  ),
}

// ─── With Icon ───────────────────────────────────────────────────────────────

export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="default">
        <PlusIcon />
        Add Item
      </Button>
      <Button variant="secondary">
        <EditIcon />
        Edit
      </Button>
      <Button variant="outline">
        <SearchIcon />
        Search
      </Button>
      <Button variant="destructive">
        <Trash2Icon />
        Delete
      </Button>
    </div>
  ),
}

// ─── Loading ─────────────────────────────────────────────────────────────────

export const Loading: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="default" disabled>
        <Spinner />
        Loading…
      </Button>
      <Button variant="secondary" disabled>
        <Spinner />
        Saving…
      </Button>
      <Button variant="outline" disabled>
        <Spinner />
        Processing…
      </Button>
    </div>
  ),
}

// ─── Disabled ────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="default" disabled>Default</Button>
      <Button variant="secondary" disabled>Secondary</Button>
      <Button variant="outline" disabled>Outline</Button>
      <Button variant="ghost" disabled>Ghost</Button>
      <Button variant="destructive" disabled>Destructive</Button>
    </div>
  ),
}

// ─── Rounded ─────────────────────────────────────────────────────────────────

export const Rounded: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-3">
      <Button className="rounded-full" size="xs">Mini</Button>
      <Button className="rounded-full" size="sm">Small</Button>
      <Button className="rounded-full" size="default">Default</Button>
      <Button className="rounded-full" size="lg">Large</Button>
      <Button className="rounded-full" size="icon" variant="outline" aria-label="Add">
        <PlusIcon />
      </Button>
    </div>
  ),
}
