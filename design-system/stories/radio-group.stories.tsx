import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

const meta = {
  title: 'BSystem/RadioGroup',
  component: RadioGroup,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

// ─── Playground ──────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: () => (
    <RadioGroup defaultValue="option-1">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option-1" id="p-1" />
        <Label htmlFor="p-1" className="cursor-pointer">Option 1</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option-2" id="p-2" />
        <Label htmlFor="p-2" className="cursor-pointer">Option 2</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option-3" id="p-3" />
        <Label htmlFor="p-3" className="cursor-pointer">Option 3</Label>
      </div>
    </RadioGroup>
  ),
}

// ─── States ──────────────────────────────────────────────────────────────────

export const States: Story = {
  render: () => (
    <RadioGroup defaultValue="checked">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="unchecked" id="st-unchecked" />
        <span className="text-sm text-muted-foreground">Unchecked</span>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="checked" id="st-checked" />
        <span className="text-sm text-muted-foreground">Checked</span>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="disabled" id="st-disabled" disabled />
        <span className="text-sm text-muted-foreground">Disabled</span>
      </div>
    </RadioGroup>
  ),
}

// ─── With Label ──────────────────────────────────────────────────────────────

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-medium">Subscription plan</Label>
      <RadioGroup defaultValue="pro" className="mt-1">
        {(
          [
            { value: 'free', label: 'Free', desc: 'Up to 3 projects' },
            { value: 'pro', label: 'Pro', desc: 'Unlimited projects' },
            { value: 'enterprise', label: 'Enterprise', desc: 'Custom pricing' },
          ] as const
        ).map(({ value, label, desc }) => (
          <div key={value} className="flex items-start gap-2">
            <RadioGroupItem value={value} id={`plan-${value}`} className="mt-0.5" />
            <div>
              <Label htmlFor={`plan-${value}`} className="cursor-pointer font-medium">
                {label}
              </Label>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </RadioGroup>
    </div>
  ),
}

// ─── Horizontal ──────────────────────────────────────────────────────────────

export const Horizontal: Story = {
  render: () => (
    <RadioGroup defaultValue="monthly" className="flex flex-row gap-6">
      {(['monthly', 'yearly'] as const).map((v) => (
        <div key={v} className="flex items-center gap-2">
          <RadioGroupItem value={v} id={`billing-${v}`} />
          <Label htmlFor={`billing-${v}`} className="cursor-pointer capitalize">
            {v}
          </Label>
        </div>
      ))}
    </RadioGroup>
  ),
}

// ─── Disabled Group ───────────────────────────────────────────────────────────

export const DisabledGroup: Story = {
  render: () => (
    <RadioGroup defaultValue="b" disabled>
      {(['a', 'b', 'c'] as const).map((v) => (
        <div key={v} className="flex items-center gap-2">
          <RadioGroupItem value={v} id={`dis-${v}`} />
          <Label htmlFor={`dis-${v}`} className="cursor-not-allowed opacity-50 capitalize">
            Option {v.toUpperCase()}
          </Label>
        </div>
      ))}
    </RadioGroup>
  ),
}
