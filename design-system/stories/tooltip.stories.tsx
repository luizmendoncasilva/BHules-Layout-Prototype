import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { Decorator } from '@storybook/nextjs-vite'

import { Button } from '@/components/ui/button'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const withTooltipProvider: Decorator = (Story) => (
  <TooltipProvider>
    <Story />
  </TooltipProvider>
)

const meta = {
  title: 'BSystem/Tooltip',
  component: Tooltip,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [withTooltipProvider],
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

// ─── Default ─────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover me</Button>
      </TooltipTrigger>
      <TooltipContent>Tooltip content</TooltipContent>
    </Tooltip>
  ),
}

// ─── All Sides ───────────────────────────────────────────────────────────────

export const AllSides: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 place-items-center w-64 h-40">
      {/* top */}
      <div />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm">Top</Button>
        </TooltipTrigger>
        <TooltipContent side="top">Above the trigger</TooltipContent>
      </Tooltip>
      <div />

      {/* left / right */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm">Left</Button>
        </TooltipTrigger>
        <TooltipContent side="left">To the left</TooltipContent>
      </Tooltip>
      <div />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm">Right</Button>
        </TooltipTrigger>
        <TooltipContent side="right">To the right</TooltipContent>
      </Tooltip>

      {/* bottom */}
      <div />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm">Bottom</Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Below the trigger</TooltipContent>
      </Tooltip>
      <div />
    </div>
  ),
}

// ─── With Kbd ────────────────────────────────────────────────────────────────

export const WithKbd: Story = {
  render: () => (
    <div className="flex gap-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Save</Button>
        </TooltipTrigger>
        <TooltipContent className="flex items-center gap-2">
          Save document
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>S</Kbd>
          </KbdGroup>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Open</Button>
        </TooltipTrigger>
        <TooltipContent className="flex items-center gap-2">
          Open file
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>O</Kbd>
          </KbdGroup>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
}

// ─── Controlled ──────────────────────────────────────────────────────────────

export const Controlled: Story = {
  render: () => {
    const ControlledExample = () => {
      const [open, setOpen] = React.useState(false)
      return (
        <div className="flex items-center gap-3">
          <Tooltip open={open} onOpenChange={setOpen}>
            <TooltipTrigger asChild>
              <Button variant="outline">Trigger</Button>
            </TooltipTrigger>
            <TooltipContent>Open state is owned by the parent</TooltipContent>
          </Tooltip>
          <Button size="sm" onClick={() => setOpen((v) => !v)}>
            {open ? 'Hide' : 'Show'} tooltip
          </Button>
        </div>
      )
    }
    return <ControlledExample />
  },
}

// ─── Click Trigger ───────────────────────────────────────────────────────────

// Click-only tooltip: by NOT passing `onOpenChange` we ignore Radix's internal
// hover/focus signals — the open state is fully owned by the parent and can
// only change through the explicit click handler.
export const ClickTrigger: Story = {
  render: () => {
    const ClickTriggerExample = () => {
      const [open, setOpen] = React.useState(false)
      const triggerRef = React.useRef<HTMLButtonElement>(null)

      // Close when clicking outside the trigger
      React.useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
          if (!triggerRef.current?.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
      }, [open])

      return (
        <Tooltip open={open}>
          <TooltipTrigger asChild>
            <Button
              ref={triggerRef}
              variant="outline"
              onClick={() => setOpen((v) => !v)}
            >
              Click me
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggled by click, not hover</TooltipContent>
        </Tooltip>
      )
    }
    return <ClickTriggerExample />
  },
}

// ─── On Icon Button ──────────────────────────────────────────────────────────

export const OnIconButton: Story = {
  render: () => (
    <div className="flex gap-3">
      {(
        [
          { label: 'Edit', key: 'E' },
          { label: 'Delete', key: 'D' },
          { label: 'Share', key: 'S' },
        ] as const
      ).map(({ label, key }) => (
        <Tooltip key={label}>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" aria-label={label}>
              <span className="text-xs font-bold">{key}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  ),
}
