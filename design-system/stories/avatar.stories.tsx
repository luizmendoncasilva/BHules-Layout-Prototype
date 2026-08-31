import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { UserIcon } from 'lucide-react'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
} from '@/components/ui/avatar'

const meta = {
  title: 'BSystem/Avatar',
  component: Avatar,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

// ─── With Image ───────────────────────────────────────────────────────────────

export const WithImage: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
      <AvatarFallback>SC</AvatarFallback>
    </Avatar>
  ),
}

// ─── Fallback Initials ────────────────────────────────────────────────────────

export const FallbackInitials: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar size="sm">
        <AvatarFallback>AM</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>AM</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>AM</AvatarFallback>
      </Avatar>
    </div>
  ),
}

// ─── Fallback Icon ────────────────────────────────────────────────────────────

export const FallbackIcon: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar size="sm">
        <AvatarFallback>
          <UserIcon className="size-3" />
        </AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>
          <UserIcon className="size-4" />
        </AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>
          <UserIcon className="size-5" />
        </AvatarFallback>
      </Avatar>
    </div>
  ),
}

// ─── Sizes ────────────────────────────────────────────────────────────────────

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      {(['sm', 'default', 'lg'] as const).map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <Avatar size={size}>
            <AvatarFallback>AR</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">{size}</span>
        </div>
      ))}
    </div>
  ),
}

// ─── With Badge ───────────────────────────────────────────────────────────────

export const WithBadge: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar size="sm">
        <AvatarFallback>AM</AvatarFallback>
        <AvatarBadge className="bg-green-500" />
      </Avatar>
      <Avatar>
        <AvatarFallback>AM</AvatarFallback>
        <AvatarBadge className="bg-green-500" />
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>AM</AvatarFallback>
        <AvatarBadge className="bg-green-500" />
      </Avatar>
    </div>
  ),
}

// ─── Group ────────────────────────────────────────────────────────────────────

export const Group: Story = {
  render: () => (
    <AvatarGroup>
      <Avatar>
        <AvatarFallback>AM</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>JS</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>KL</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+4</AvatarGroupCount>
    </AvatarGroup>
  ),
}
