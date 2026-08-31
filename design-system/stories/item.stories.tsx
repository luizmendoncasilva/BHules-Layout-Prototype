import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import {
  BellIcon,
  CreditCardIcon,
  FileTextIcon,
  KeyIcon,
  MailIcon,
  ShieldIcon,
  UserIcon,
  StarIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

import { Item, ItemBadge } from '@/components/ui/item'

const meta = {
  title: 'BSystem/Item',
  component: Item,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Item>

export default meta
type Story = StoryObj<typeof meta>

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => (
    <div className="w-80">
      <Item
        icon={<UserIcon />}
        title="Profile"
        description="Manage your personal information"
        onClick={() => {}}
      />
    </div>
  ),
}

// ─── Without Icon ─────────────────────────────────────────────────────────────

export const WithoutIcon: Story = {
  render: () => (
    <div className="w-80">
      <Item
        title="Profile"
        description="Manage your personal information"
        onClick={() => {}}
      />
    </div>
  ),
}

// ─── Without Description ──────────────────────────────────────────────────────

export const WithoutDescription: Story = {
  render: () => (
    <div className="w-80">
      <Item icon={<UserIcon />} title="Profile" onClick={() => {}} />
    </div>
  ),
}

// ─── Static (No Chevron) ──────────────────────────────────────────────────────

export const Static: Story = {
  render: () => (
    <div className="w-80">
      <Item
        icon={<MailIcon />}
        title="Email"
        description="arthur@bhub.com.br"
      />
    </div>
  ),
}

// ─── Custom Action ────────────────────────────────────────────────────────────

export const CustomAction: Story = {
  render: () => (
    <div className="w-80">
      <Item
        icon={<BellIcon />}
        title="Notifications"
        description="You have 3 unread notifications"
        action={
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
            3
          </span>
        }
      />
    </div>
  ),
}

// ─── List ─────────────────────────────────────────────────────────────────────

export const List: Story = {
  render: () => (
    <div className="w-80 flex flex-col gap-2">
      <Item icon={<UserIcon />} title="Profile" description="Personal info" onClick={() => {}} />
      <Item icon={<ShieldIcon />} title="Security" description="Password & 2FA" onClick={() => {}} />
      <Item icon={<CreditCardIcon />} title="Billing" description="Manage subscription" onClick={() => {}} />
      <Item icon={<BellIcon />} title="Notifications" description="Email & push" onClick={() => {}} />
      <Item icon={<KeyIcon />} title="API Keys" description="Manage access tokens" onClick={() => {}} />
    </div>
  ),
}

// ─── With Custom Action Button ────────────────────────────────────────────────

export const WithButtonAction: Story = {
  render: () => (
    <div className="w-80 flex flex-col gap-2">
      <Item
        icon={<FileTextIcon />}
        title="Terms of Service"
        description="Last updated Jan 2025"
        action={<Button size="sm" variant="outline">View</Button>}
      />
      <Item
        icon={<StarIcon />}
        title="Upgrade plan"
        description="Unlock more features"
        action={<Button size="sm">Upgrade</Button>}
      />
    </div>
  ),
}

// ─── ItemBadge ────────────────────────────────────────────────────────────────

export const BadgeShowcase: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <ItemBadge><UserIcon /></ItemBadge>
      <ItemBadge><ShieldIcon /></ItemBadge>
      <ItemBadge><BellIcon /></ItemBadge>
      <ItemBadge><KeyIcon /></ItemBadge>
    </div>
  ),
}
