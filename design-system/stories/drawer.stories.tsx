import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { PlusIcon } from 'lucide-react'

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const meta = {
  title: 'BSystem/Drawer',
  component: Drawer,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Drawer>

export default meta
type Story = StoryObj<typeof meta>

// ─── Bottom (default) ─────────────────────────────────────────────────────────

export const Bottom: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Open bottom drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Move goal</DrawerTitle>
          <DrawerDescription>
            Set your daily activity goal.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 py-2">
          <p className="text-sm text-muted-foreground">
            Content goes here. Drag down to dismiss.
          </p>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button>Submit</Button>
          </DrawerClose>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
}

// ─── Right ────────────────────────────────────────────────────────────────────

export const Right: Story = {
  render: () => (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button variant="outline">Open right drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Edit record</DrawerTitle>
          <DrawerDescription>
            Update the details for this record.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 px-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="drawer-name">Name</Label>
            <Input id="drawer-name" defaultValue="Acme Corp" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="drawer-cnpj">CNPJ</Label>
            <Input id="drawer-cnpj" defaultValue="12.345.678/0001-99" />
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button>Save</Button>
          </DrawerClose>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
}

// ─── Left ─────────────────────────────────────────────────────────────────────

export const Left: Story = {
  render: () => (
    <Drawer direction="left">
      <DrawerTrigger asChild>
        <Button variant="outline">Open left drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Navigation</DrawerTitle>
          <DrawerDescription>Quick access to all sections.</DrawerDescription>
        </DrawerHeader>
        <nav className="flex flex-col gap-1 px-4">
          {['Dashboard', 'Transactions', 'Reports', 'Settings'].map((item) => (
            <DrawerClose asChild key={item}>
              <Button variant="ghost" className="justify-start">
                {item}
              </Button>
            </DrawerClose>
          ))}
        </nav>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
}

// ─── Top ──────────────────────────────────────────────────────────────────────

export const Top: Story = {
  render: () => (
    <Drawer direction="top">
      <DrawerTrigger asChild>
        <Button variant="outline">Open top drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerDescription>
            Narrow down results with filters.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-wrap gap-3 px-4 py-2">
          {['Paid', 'Pending', 'Overdue', 'Draft'].map((status) => (
            <Button key={status} variant="outline" size="sm">
              {status}
            </Button>
          ))}
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button>Apply filters</Button>
          </DrawerClose>
          <DrawerClose asChild>
            <Button variant="outline">Clear</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
}

// ─── With Form ────────────────────────────────────────────────────────────────

export const WithForm: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button>
          <PlusIcon />
          New transaction
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Add transaction</DrawerTitle>
          <DrawerDescription>
            Record a new financial transaction.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 px-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tx-desc">Description</Label>
            <Input id="tx-desc" placeholder="e.g. Invoice #1042" />
          </div>
          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="tx-value">Value (R$)</Label>
              <Input id="tx-value" type="number" placeholder="0,00" />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="tx-date">Date</Label>
              <Input id="tx-date" type="date" />
            </div>
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button>Add transaction</Button>
          </DrawerClose>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
}
