import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const meta = {
  title: 'BSystem/Checkbox',
  component: Checkbox,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    disabled: { control: 'boolean' },
    defaultChecked: { control: 'boolean' },
  },
  args: {
    disabled: false,
    defaultChecked: false,
  },
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

// ─── Playground ──────────────────────────────────────────────────────────────

export const Playground: Story = {}

// ─── States ──────────────────────────────────────────────────────────────────

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Checkbox id="s-unchecked" />
        <span className="text-sm text-muted-foreground">Unchecked</span>
      </div>
      <div className="flex items-center gap-3">
        <Checkbox id="s-checked" defaultChecked />
        <span className="text-sm text-muted-foreground">Checked</span>
      </div>
      <div className="flex items-center gap-3">
        <Checkbox id="s-disabled" disabled />
        <span className="text-sm text-muted-foreground">Disabled unchecked</span>
      </div>
      <div className="flex items-center gap-3">
        <Checkbox id="s-disabled-checked" disabled defaultChecked />
        <span className="text-sm text-muted-foreground">Disabled checked</span>
      </div>
    </div>
  ),
}

// ─── With Label ──────────────────────────────────────────────────────────────

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Checkbox id="terms" />
        <Label htmlFor="terms" className="cursor-pointer">
          Accept terms and conditions
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="newsletter" defaultChecked />
        <Label htmlFor="newsletter" className="cursor-pointer">
          Subscribe to newsletter
        </Label>
      </div>
      <div className="flex items-center gap-2 opacity-50">
        <Checkbox id="locked" disabled defaultChecked />
        <Label htmlFor="locked" className="cursor-not-allowed">
          Required (locked)
        </Label>
      </div>
    </div>
  ),
}

// ─── Group ───────────────────────────────────────────────────────────────────

export const Group: Story = {
  render: () => (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium text-foreground mb-1">
        Notify me about…
      </legend>
      {(
        [
          { id: 'comments', label: 'New comments on my posts' },
          { id: 'mentions', label: 'Mentions and replies', checked: true },
          { id: 'follows', label: 'New followers', checked: true },
          { id: 'system', label: 'System announcements', disabled: true },
        ] as const
      ).map(({ id, label, checked, disabled }) => (
        <div key={id} className="flex items-center gap-2">
          <Checkbox id={id} defaultChecked={checked} disabled={disabled} />
          <Label
            htmlFor={id}
            className={disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          >
            {label}
          </Label>
        </div>
      ))}
    </fieldset>
  ),
}
