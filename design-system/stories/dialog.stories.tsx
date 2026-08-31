import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { SettingsIcon, UserIcon } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const meta = {
  title: 'BSystem/Dialog',
  component: Dialog,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton>
          <Button variant="destructive">Delete account</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

// ─── Edit Profile ─────────────────────────────────────────────────────────────

export const EditProfile: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <UserIcon />
          Edit profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue="Arthur Moreira" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue="arthur@bhub.com.br" />
          </div>
        </div>
        <DialogFooter showCloseButton>
          <Button>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export const Settings: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <SettingsIcon />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Preferences</DialogTitle>
          <DialogDescription>
            Manage your notification and display preferences.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2 text-sm text-muted-foreground">
          <p>Setting options would appear here.</p>
        </div>
        <DialogFooter showCloseButton>
          <Button>Save preferences</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

// ─── Without Close Button ────────────────────────────────────────────────────

export const WithoutCloseButton: Story = {
  render: () => {
    const [open, setOpen] = React.useState(false)

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Open (no × button)</Button>
        </DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Confirm action</DialogTitle>
            <DialogDescription>
              You must choose an option to continue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  },
}

// ─── Controlled ───────────────────────────────────────────────────────────────

export const Controlled: Story = {
  render: () => {
    const [open, setOpen] = React.useState(false)
    const [submitted, setSubmitted] = React.useState(false)

    const handleSubmit = () => {
      setSubmitted(true)
      setOpen(false)
    }

    return (
      <div className="flex flex-col items-center gap-4">
        {submitted && (
          <p className="text-sm text-muted-foreground">Form submitted!</p>
        )}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSubmitted(false)}>Open form</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit feedback</DialogTitle>
              <DialogDescription>
                Share your thoughts with our team.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-1.5 py-2">
              <Label htmlFor="feedback">Feedback</Label>
              <Input id="feedback" placeholder="Your feedback..." />
            </div>
            <DialogFooter showCloseButton>
              <Button onClick={handleSubmit}>Submit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  },
}
