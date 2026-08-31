import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { Decorator } from '@storybook/nextjs-vite'

import { Kbd, KbdGroup } from '@/components/ui/kbd'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'

const withTooltipProvider: Decorator = (Story) => (
  <TooltipProvider>
    <Story />
  </TooltipProvider>
)

const meta = {
  title: 'BSystem/Kbd',
  component: Kbd,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    children: '⌘',
  },
} satisfies Meta<typeof Kbd>

export default meta
type Story = StoryObj<typeof meta>

// ─── Playground ──────────────────────────────────────────────────────────────

export const Playground: Story = {}

// ─── Single Keys ─────────────────────────────────────────────────────────────

export const SingleKeys: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {['⌘', '⌥', '⇧', '⌃', '⎋', '⏎', '⌫', 'Tab', 'F1', 'A', '1'].map((key) => (
        <Kbd key={key}>{key}</Kbd>
      ))}
    </div>
  ),
}

// ─── Key Groups (Shortcuts) ───────────────────────────────────────────────────

export const KeyGroups: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {(
        [
          { label: 'Save', keys: ['⌘', 'S'] },
          { label: 'Save As', keys: ['⌘', '⇧', 'S'] },
          { label: 'Undo', keys: ['⌘', 'Z'] },
          { label: 'Redo', keys: ['⌘', '⇧', 'Z'] },
          { label: 'Find', keys: ['⌘', 'F'] },
          { label: 'Close', keys: ['⌘', 'W'] },
        ] as const
      ).map(({ label, keys }) => (
        <div key={label} className="flex items-center justify-between w-48">
          <span className="text-sm text-muted-foreground">{label}</span>
          <KbdGroup>
            {keys.map((k) => (
              <Kbd key={k}>{k}</Kbd>
            ))}
          </KbdGroup>
        </div>
      ))}
    </div>
  ),
}

// ─── In Tooltip ──────────────────────────────────────────────────────────────

export const InTooltip: Story = {
  decorators: [withTooltipProvider],
  render: () => (
    <div className="flex gap-3">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm">Save</Button>
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
          <Button variant="outline" size="sm">Undo</Button>
        </TooltipTrigger>
        <TooltipContent className="flex items-center gap-2">
          Undo last action
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>Z</Kbd>
          </KbdGroup>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
}

// ─── In Prose ────────────────────────────────────────────────────────────────

export const InProse: Story = {
  render: () => (
    <p className="text-sm text-foreground max-w-xs leading-relaxed">
      Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to open the command palette. Use{' '}
      <Kbd>↑</Kbd> <Kbd>↓</Kbd> to navigate and <Kbd>⏎</Kbd> to select.
    </p>
  ),
}
