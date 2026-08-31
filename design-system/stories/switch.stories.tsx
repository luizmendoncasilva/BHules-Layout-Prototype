import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

const meta = {
  title: 'BSystem/Switch',
  component: Switch,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['default', 'sm'] },
    disabled: { control: 'boolean' },
    defaultChecked: { control: 'boolean' },
  },
  args: {
    size: 'default',
    disabled: false,
    defaultChecked: false,
  },
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

// ─── Playground ──────────────────────────────────────────────────────────────

export const Playground: Story = {}

// ─── Sizes ───────────────────────────────────────────────────────────────────

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <Switch size="sm" defaultChecked />
        <span className="text-xs text-muted-foreground">sm</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Switch size="default" defaultChecked />
        <span className="text-xs text-muted-foreground">default</span>
      </div>
    </div>
  ),
}

// ─── States ──────────────────────────────────────────────────────────────────

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Switch />
        <span className="text-sm text-muted-foreground">Unchecked</span>
      </div>
      <div className="flex items-center gap-4">
        <Switch defaultChecked />
        <span className="text-sm text-muted-foreground">Checked</span>
      </div>
      <div className="flex items-center gap-4">
        <Switch disabled />
        <span className="text-sm text-muted-foreground">Disabled unchecked</span>
      </div>
      <div className="flex items-center gap-4">
        <Switch disabled defaultChecked />
        <span className="text-sm text-muted-foreground">Disabled checked</span>
      </div>
    </div>
  ),
}

// ─── With Label ──────────────────────────────────────────────────────────────

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-8 w-64">
        <Label htmlFor="notifications" className="cursor-pointer">
          Email notifications
        </Label>
        <Switch id="notifications" defaultChecked />
      </div>
      <div className="flex items-center justify-between gap-8 w-64">
        <Label htmlFor="marketing" className="cursor-pointer">
          Marketing emails
        </Label>
        <Switch id="marketing" />
      </div>
      <div className="flex items-center justify-between gap-8 w-64">
        <Label htmlFor="updates" className="cursor-pointer opacity-50">
          Product updates
        </Label>
        <Switch id="updates" disabled />
      </div>
    </div>
  ),
}
