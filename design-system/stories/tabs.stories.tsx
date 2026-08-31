import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { UserIcon, CreditCardIcon, BellIcon, ShieldIcon } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const meta = {
  title: 'BSystem/Tabs',
  component: Tabs,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

// ─── Default (Pill) ───────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-96">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <p className="text-sm text-muted-foreground p-1">
          Manage your account details and preferences.
        </p>
      </TabsContent>
      <TabsContent value="password">
        <p className="text-sm text-muted-foreground p-1">
          Change your password here. After saving, you&apos;ll be logged out.
        </p>
      </TabsContent>
      <TabsContent value="settings">
        <p className="text-sm text-muted-foreground p-1">
          Configure application settings and notifications.
        </p>
      </TabsContent>
    </Tabs>
  ),
}

// ─── Line Variant ─────────────────────────────────────────────────────────────

export const LineVariant: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-96">
      <TabsList variant="line">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <p className="text-sm text-muted-foreground pt-3">
          Overview of your project metrics and activity.
        </p>
      </TabsContent>
      <TabsContent value="analytics">
        <p className="text-sm text-muted-foreground pt-3">
          Detailed analytics and performance data.
        </p>
      </TabsContent>
      <TabsContent value="reports">
        <p className="text-sm text-muted-foreground pt-3">
          Generated reports and exports.
        </p>
      </TabsContent>
      <TabsContent value="notifications">
        <p className="text-sm text-muted-foreground pt-3">
          Notification history and preferences.
        </p>
      </TabsContent>
    </Tabs>
  ),
}

// ─── With Icons ───────────────────────────────────────────────────────────────

export const WithIcons: Story = {
  render: () => (
    <Tabs defaultValue="profile" className="w-96">
      <TabsList>
        <TabsTrigger value="profile">
          <UserIcon />
          Profile
        </TabsTrigger>
        <TabsTrigger value="billing">
          <CreditCardIcon />
          Billing
        </TabsTrigger>
        <TabsTrigger value="notifications">
          <BellIcon />
          Alerts
        </TabsTrigger>
        <TabsTrigger value="security">
          <ShieldIcon />
          Security
        </TabsTrigger>
      </TabsList>
      <TabsContent value="profile">
        <p className="text-sm text-muted-foreground p-1">Profile settings.</p>
      </TabsContent>
      <TabsContent value="billing">
        <p className="text-sm text-muted-foreground p-1">Billing & plans.</p>
      </TabsContent>
      <TabsContent value="notifications">
        <p className="text-sm text-muted-foreground p-1">Alert preferences.</p>
      </TabsContent>
      <TabsContent value="security">
        <p className="text-sm text-muted-foreground p-1">Security settings.</p>
      </TabsContent>
    </Tabs>
  ),
}

// ─── Vertical ─────────────────────────────────────────────────────────────────

export const Vertical: Story = {
  render: () => (
    <Tabs defaultValue="account" orientation="vertical" className="w-80">
      <TabsList className="h-auto">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
        <TabsTrigger value="danger" className="text-destructive">
          Danger Zone
        </TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <p className="text-sm text-muted-foreground">Account details.</p>
      </TabsContent>
      <TabsContent value="password">
        <p className="text-sm text-muted-foreground">Change your password.</p>
      </TabsContent>
      <TabsContent value="settings">
        <p className="text-sm text-muted-foreground">App settings.</p>
      </TabsContent>
      <TabsContent value="danger">
        <p className="text-sm text-muted-foreground">Danger zone actions.</p>
      </TabsContent>
    </Tabs>
  ),
}

// ─── With Disabled Tab ────────────────────────────────────────────────────────

export const WithDisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="active" className="w-80">
      <TabsList>
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="draft">Draft</TabsTrigger>
        <TabsTrigger value="archived" disabled>
          Archived
        </TabsTrigger>
      </TabsList>
      <TabsContent value="active">
        <p className="text-sm text-muted-foreground p-1">Active items.</p>
      </TabsContent>
      <TabsContent value="draft">
        <p className="text-sm text-muted-foreground p-1">Draft items.</p>
      </TabsContent>
    </Tabs>
  ),
}
