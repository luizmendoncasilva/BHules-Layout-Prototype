import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { CalendarIcon, LinkIcon, MapPinIcon } from 'lucide-react'

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Button } from '@/components/ui/button'

const meta = {
  title: 'BSystem/HoverCard',
  component: HoverCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof HoverCard>

export default meta
type Story = StoryObj<typeof meta>

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="ghost" className="text-primary underline underline-offset-4 px-0 h-auto font-normal">@bhub</Button>
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">BHub</p>
          <p className="text-sm text-muted-foreground">
            Building the best financial platform for Brazilian businesses.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarIcon className="size-3" />
            <span>Joined January 2020</span>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
}

// ─── With Rich Content ────────────────────────────────────────────────────────

export const WithRichContent: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="outline" size="sm">
          <LinkIcon />
          View profile
        </Button>
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
              AR
            </div>
            <div>
              <p className="text-sm font-semibold">Arthur Moreira</p>
              <p className="text-xs text-muted-foreground">@arthurmoreira</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Frontend engineer & design systems enthusiast.
          </p>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPinIcon className="size-3" />
              <span>São Paulo, Brazil</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarIcon className="size-3" />
              <span>Joined March 2021</span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
}

// ─── Align Variants ───────────────────────────────────────────────────────────

export const AlignVariants: Story = {
  render: () => (
    <div className="flex gap-6">
      {(['start', 'center', 'end'] as const).map((align) => (
        <HoverCard key={align}>
          <HoverCardTrigger asChild>
            <Button variant="outline" size="sm">
              align={align}
            </Button>
          </HoverCardTrigger>
          <HoverCardContent align={align}>
            <p className="text-sm text-muted-foreground">
              Content aligned to <strong>{align}</strong>.
            </p>
          </HoverCardContent>
        </HoverCard>
      ))}
    </div>
  ),
}

// ─── Default Open ─────────────────────────────────────────────────────────────

export const DefaultOpen: Story = {
  render: () => (
    <div className="pt-48">
      <HoverCard defaultOpen>
        <HoverCardTrigger asChild>
          <Button variant="ghost" className="text-primary underline underline-offset-4 px-0 h-auto font-normal">Hover to see card</Button>
        </HoverCardTrigger>
        <HoverCardContent>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold">BSystem</p>
            <p className="text-sm text-muted-foreground">
              The official design system for BHub products.
            </p>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  ),
}
