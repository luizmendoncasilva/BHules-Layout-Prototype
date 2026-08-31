import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { MenuIcon, PlusIcon, SettingsIcon } from 'lucide-react'

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const meta = {
  title: 'BSystem/Sheet',
  component: Sheet,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Sheet>

export default meta
type Story = StoryObj<typeof meta>

// ─── Right (default) ──────────────────────────────────────────────────────────

export const Right: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open right sheet</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sheet-name">Name</Label>
            <Input id="sheet-name" defaultValue="Arthur Moreira" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sheet-email">Email</Label>
            <Input
              id="sheet-email"
              type="email"
              defaultValue="arthur@bhub.com.br"
            />
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <SheetClose asChild>
            <Button>Save changes</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
}

// ─── Left ─────────────────────────────────────────────────────────────────────

export const Left: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <MenuIcon />
          Open navigation
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>Quick access to all sections.</SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4">
          {['Dashboard', 'Transactions', 'Reports', 'Settings'].map((item) => (
            <SheetClose asChild key={item}>
              <Button variant="ghost" className="justify-start">
                {item}
              </Button>
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  ),
}

// ─── Top ──────────────────────────────────────────────────────────────────────

export const Top: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open top sheet</Button>
      </SheetTrigger>
      <SheetContent side="top">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>
            You have 3 unread notifications.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-2 px-4">
          {[
            'New invoice received from Acme Corp',
            'Your report is ready to download',
            'Action required: verify your email',
          ].map((msg, i) => (
            <p key={i} className="text-sm text-muted-foreground border-b pb-2 last:border-0">
              {msg}
            </p>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  ),
}

// ─── Bottom ───────────────────────────────────────────────────────────────────

export const Bottom: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>
          <PlusIcon />
          Add item
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Add new item</SheetTitle>
          <SheetDescription>
            Fill in the details below to add a new item.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 py-2 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-1.5 flex-1">
            <Label htmlFor="item-name">Item name</Label>
            <Input id="item-name" placeholder="e.g. Office supplies" />
          </div>
          <div className="flex flex-col gap-1.5 w-32">
            <Label htmlFor="item-value">Value (R$)</Label>
            <Input id="item-value" type="number" placeholder="0,00" />
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <SheetClose asChild>
            <Button>Add item</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
}

// ─── Without Close Button ────────────────────────────────────────────────────

export const WithoutCloseButton: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <SettingsIcon />
          Settings (no × button)
        </Button>
      </SheetTrigger>
      <SheetContent showCloseButton={false}>
        <SheetHeader>
          <SheetTitle>Application settings</SheetTitle>
          <SheetDescription>
            Close button is hidden — use the footer to dismiss.
          </SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline" className="w-full">
              Close
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
}
