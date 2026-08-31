import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon, BoldIcon, ItalicIcon, UnderlineIcon } from 'lucide-react'

import { ButtonGroup } from '@/components/ui/button-group'
import { Button } from '@/components/ui/button'

const meta = {
  title: 'BSystem/ButtonGroup',
  component: ButtonGroup,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ButtonGroup>

export default meta
type Story = StoryObj<typeof meta>

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="outline">Previous</Button>
      <Button variant="outline">Current</Button>
      <Button variant="outline">Next</Button>
    </ButtonGroup>
  ),
}

// ─── Icon Buttons ─────────────────────────────────────────────────────────────

export const IconButtons: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="outline" size="icon">
        <AlignLeftIcon />
        <span className="sr-only">Align left</span>
      </Button>
      <Button variant="outline" size="icon">
        <AlignCenterIcon />
        <span className="sr-only">Align center</span>
      </Button>
      <Button variant="outline" size="icon">
        <AlignRightIcon />
        <span className="sr-only">Align right</span>
      </Button>
    </ButtonGroup>
  ),
}

// ─── Text Formatting ──────────────────────────────────────────────────────────

export const TextFormatting: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <ButtonGroup>
        <Button variant="outline" size="icon-sm">
          <BoldIcon />
        </Button>
        <Button variant="outline" size="icon-sm">
          <ItalicIcon />
        </Button>
        <Button variant="outline" size="icon-sm">
          <UnderlineIcon />
        </Button>
      </ButtonGroup>
    </div>
  ),
}

// ─── Sizes ────────────────────────────────────────────────────────────────────

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {(['sm', 'default', 'lg'] as const).map((size) => (
        <div key={size} className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground w-12">{size}</span>
          <ButtonGroup>
            <Button variant="outline" size={size}>First</Button>
            <Button variant="outline" size={size}>Middle</Button>
            <Button variant="outline" size={size}>Last</Button>
          </ButtonGroup>
        </div>
      ))}
    </div>
  ),
}

// ─── Mixed Variants ───────────────────────────────────────────────────────────

export const MixedVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <ButtonGroup>
        <Button variant="outline">Cancel</Button>
        <Button>Confirm</Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="secondary">Save draft</Button>
        <Button>Publish</Button>
      </ButtonGroup>
    </div>
  ),
}
