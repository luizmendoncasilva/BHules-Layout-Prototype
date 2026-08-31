import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { SearchIcon, EyeIcon, MailIcon } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const meta = {
  title: 'BSystem/Input',
  component: Input,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'search', 'number', 'url'],
    },
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
  args: {
    type: 'text',
    placeholder: 'Placeholder…',
    disabled: false,
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

// ─── Playground ──────────────────────────────────────────────────────────────

export const Playground: Story = {}

// ─── Types ───────────────────────────────────────────────────────────────────

export const Types: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-64">
      <Input type="text"     placeholder="Text…" />
      <Input type="email"    placeholder="Email…" />
      <Input type="password" placeholder="Password…" />
      <Input type="search"   placeholder="Search…" />
      <Input type="number"   placeholder="Number…" />
      <Input type="url"      placeholder="https://…" />
    </div>
  ),
}

// ─── States ──────────────────────────────────────────────────────────────────

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-64">
      <Input placeholder="Default" />
      <Input placeholder="With value" defaultValue="Arthur Moreira" />
      <Input placeholder="Disabled" disabled />
      <Input placeholder="Disabled with value" defaultValue="Locked" disabled />
      <Input
        placeholder="Invalid"
        aria-invalid="true"
        defaultValue="bad@email"
      />
    </div>
  ),
}

// ─── With Label ──────────────────────────────────────────────────────────────

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-64">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" placeholder="Arthur Moreira" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="arthur@bhub.com.br" />
        <p className="text-xs text-muted-foreground">
          We&apos;ll never share your email.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email-err" className="text-destructive">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email-err"
          type="email"
          defaultValue="invalid"
          aria-invalid="true"
        />
        <p className="text-xs text-destructive">Please enter a valid email.</p>
      </div>
    </div>
  ),
}

// ─── With Icon ───────────────────────────────────────────────────────────────

export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-64">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search…" />
      </div>
      <div className="relative">
        <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input className="pl-9" type="email" placeholder="Email…" />
      </div>
      <div className="relative">
        <Input type="password" placeholder="Password…" className="pr-9" />
        <EyeIcon className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      </div>
    </div>
  ),
}
