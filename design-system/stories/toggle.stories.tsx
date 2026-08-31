import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { BoldIcon, ItalicIcon, UnderlineIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon } from 'lucide-react'

import { Toggle } from '@/components/ui/toggle'

const meta = {
  title: 'BSystem/Toggle',
  component: Toggle,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'outline'] },
    size: { control: 'select', options: ['sm', 'default', 'lg'] },
    disabled: { control: 'boolean' },
    pressed: { control: 'boolean' },
  },
  args: {
    variant: 'default',
    size: 'default',
    disabled: false,
    children: 'Toggle',
  },
} satisfies Meta<typeof Toggle>

export default meta
type Story = StoryObj<typeof meta>

// ─── Playground ──────────────────────────────────────────────────────────────

export const Playground: Story = {}

// ─── Variants ────────────────────────────────────────────────────────────────

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Toggle variant="default">Default</Toggle>
      <Toggle variant="outline">Outline</Toggle>
    </div>
  ),
}

// ─── Sizes ───────────────────────────────────────────────────────────────────

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-3">
      <Toggle size="sm" variant="outline">Small</Toggle>
      <Toggle size="default" variant="outline">Default</Toggle>
      <Toggle size="lg" variant="outline">Large</Toggle>
    </div>
  ),
}

// ─── States ──────────────────────────────────────────────────────────────────

export const States: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Toggle variant="outline">Off</Toggle>
      <Toggle variant="outline" defaultPressed>On</Toggle>
      <Toggle variant="outline" disabled>Disabled off</Toggle>
      <Toggle variant="outline" disabled defaultPressed>Disabled on</Toggle>
    </div>
  ),
}

// ─── With Icons ──────────────────────────────────────────────────────────────

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1">
        <Toggle size="sm" variant="outline" aria-label="Bold" defaultPressed>
          <BoldIcon />
        </Toggle>
        <Toggle size="sm" variant="outline" aria-label="Italic">
          <ItalicIcon />
        </Toggle>
        <Toggle size="sm" variant="outline" aria-label="Underline">
          <UnderlineIcon />
        </Toggle>
      </div>
      <div className="flex items-center gap-1">
        <Toggle size="sm" variant="outline" aria-label="Align left" defaultPressed>
          <AlignLeftIcon />
        </Toggle>
        <Toggle size="sm" variant="outline" aria-label="Align center">
          <AlignCenterIcon />
        </Toggle>
        <Toggle size="sm" variant="outline" aria-label="Align right">
          <AlignRightIcon />
        </Toggle>
      </div>
    </div>
  ),
}

// ─── With Text and Icon ───────────────────────────────────────────────────────

export const WithTextAndIcon: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Toggle variant="outline" defaultPressed>
        <BoldIcon />
        Bold
      </Toggle>
      <Toggle variant="outline">
        <ItalicIcon />
        Italic
      </Toggle>
    </div>
  ),
}
