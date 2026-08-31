import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import {
  BellIcon,
  DownloadIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  TrashIcon,
} from 'lucide-react'

import { IconButton } from '@/components/ui/icon-button'

const meta = {
  title: 'BSystem/IconButton',
  component: IconButton,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof IconButton>

export default meta
type Story = StoryObj<typeof meta>

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => (
    <IconButton aria-label="Settings">
      <SettingsIcon />
    </IconButton>
  ),
}

// ─── Variants ────────────────────────────────────────────────────────────────

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-3 flex-wrap">
      {(['default', 'secondary', 'outline', 'ghost', 'destructive', 'info', 'warning', 'success'] as const).map((variant) => (
        <div key={variant} className="flex flex-col items-center gap-2">
          <IconButton variant={variant} aria-label={variant}>
            <BellIcon />
          </IconButton>
          <span className="text-xs text-muted-foreground">{variant}</span>
        </div>
      ))}
    </div>
  ),
}

// ─── Sizes ────────────────────────────────────────────────────────────────────

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-3">
      {(['xs', 'sm', 'default', 'lg'] as const).map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <IconButton size={size} variant="outline" aria-label={size}>
            <PlusIcon />
          </IconButton>
          <span className="text-xs text-muted-foreground">{size}</span>
        </div>
      ))}
    </div>
  ),
}

// ─── Common Actions ───────────────────────────────────────────────────────────

export const CommonActions: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <IconButton variant="outline" aria-label="Search">
        <SearchIcon />
      </IconButton>
      <IconButton variant="outline" aria-label="Add">
        <PlusIcon />
      </IconButton>
      <IconButton variant="outline" aria-label="Download">
        <DownloadIcon />
      </IconButton>
      <IconButton variant="ghost" aria-label="Notifications">
        <BellIcon />
      </IconButton>
      <IconButton variant="destructive" aria-label="Delete">
        <TrashIcon />
      </IconButton>
    </div>
  ),
}

// ─── Disabled ────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <IconButton aria-label="Disabled default" disabled>
        <SettingsIcon />
      </IconButton>
      <IconButton variant="outline" aria-label="Disabled outline" disabled>
        <DownloadIcon />
      </IconButton>
      <IconButton variant="ghost" aria-label="Disabled ghost" disabled>
        <BellIcon />
      </IconButton>
    </div>
  ),
}
