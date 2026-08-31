import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { MoreHorizontalIcon, TrendingUpIcon } from 'lucide-react'

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const meta = {
  title: 'BSystem/Card',
  component: Card,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

// ─── Simple ───────────────────────────────────────────────────────────────────

export const Simple: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          This is the card content area. Add any content here.
        </p>
      </CardContent>
    </Card>
  ),
}

// ─── With Footer ──────────────────────────────────────────────────────────────

export const WithFooter: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Invoice #1042</CardTitle>
        <CardDescription>Acme Corp · Due Dec 31, 2025</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">R$ 4.800,00</p>
        <p className="text-sm text-muted-foreground mt-1">Services rendered</p>
      </CardContent>
      <CardFooter className="border-t pt-6 gap-2">
        <Button variant="outline" className="flex-1">
          Reject
        </Button>
        <Button className="flex-1">Approve</Button>
      </CardFooter>
    </Card>
  ),
}

// ─── With Action ──────────────────────────────────────────────────────────────

export const WithAction: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Monthly Revenue</CardTitle>
        <CardDescription>January 2025</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontalIcon />
            <span className="sr-only">Options</span>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2">
          <p className="text-3xl font-semibold">R$ 24.500</p>
          <Badge variant="outline" className="mb-1 text-green-600 border-green-200 bg-green-50">
            <TrendingUpIcon className="size-3" />
            +12%
          </Badge>
        </div>
      </CardContent>
    </Card>
  ),
}

// ─── Padding ──────────────────────────────────────────────────────────────────

export const Padding: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      {(['none', 'sm', 'md', 'lg'] as const).map((padding) => (
        <Card key={padding} padding={padding}>
          <CardHeader>
            <CardTitle>padding=&ldquo;{padding}&rdquo;</CardTitle>
            <CardDescription>
              The Card and its sub-components share padding via context.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Content reflects the chosen spacing scale.
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
}

// ─── Metric Grid ──────────────────────────────────────────────────────────────

export const MetricGrid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-[560px]">
      {[
        { label: 'Revenue', value: 'R$ 24.500', change: '+12%' },
        { label: 'Invoices', value: '142', change: '+5%' },
        { label: 'Clients', value: '38', change: '+2%' },
        { label: 'Avg. Ticket', value: 'R$ 648', change: '-3%' },
      ].map(({ label, value, change }) => (
        <Card key={label}>
          <CardHeader>
            <CardDescription>{label}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{change} this month</p>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
}
