import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

const meta = {
  title: 'BSystem/Textarea',
  component: Textarea,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
  args: {
    placeholder: 'Type something…',
    disabled: false,
  },
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

// ─── Playground ──────────────────────────────────────────────────────────────

export const Playground: Story = {}

// ─── States ──────────────────────────────────────────────────────────────────

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-72">
      <Textarea placeholder="Default" />
      <Textarea placeholder="With value" defaultValue="This is some pre-filled content that spans a couple of lines." />
      <Textarea placeholder="Disabled" disabled />
      <Textarea
        placeholder="Invalid"
        aria-invalid="true"
        defaultValue="This content has an error."
      />
    </div>
  ),
}

// ─── With Label ──────────────────────────────────────────────────────────────

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-72">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" placeholder="Tell us a bit about yourself…" />
        <p className="text-xs text-muted-foreground">Max 200 characters.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="feedback-err" className="text-destructive">
          Feedback <span>*</span>
        </Label>
        <Textarea
          id="feedback-err"
          aria-invalid="true"
          defaultValue="x"
        />
        <p className="text-xs text-destructive">
          Must be at least 20 characters.
        </p>
      </div>
    </div>
  ),
}

// ─── Fixed Height ─────────────────────────────────────────────────────────────

export const FixedHeight: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-72">
      <Textarea
        className="min-h-16 field-sizing-fixed resize-none"
        placeholder="Small (64px)…"
      />
      <Textarea
        className="min-h-32 field-sizing-fixed resize-none"
        placeholder="Medium (128px)…"
      />
      <Textarea
        className="min-h-48 field-sizing-fixed resize-none"
        placeholder="Large (192px)…"
      />
    </div>
  ),
}
