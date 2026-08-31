import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  InfoIcon,
  TerminalIcon,
  TriangleAlertIcon,
} from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const meta = {
  title: 'BSystem/Alert',
  component: Alert,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => (
    <Alert className="w-96">
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        You can add components to your app using the CLI.
      </AlertDescription>
    </Alert>
  ),
}

// ─── Destructive ──────────────────────────────────────────────────────────────

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive" className="w-96">
      <AlertCircleIcon />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Your session has expired. Please log in again to continue.
      </AlertDescription>
    </Alert>
  ),
}

// ─── Success ──────────────────────────────────────────────────────────────────

export const Success: Story = {
  render: () => (
    <Alert variant="success" className="w-96">
      <CheckCircle2Icon />
      <AlertTitle>Success</AlertTitle>
      <AlertDescription>
        Your changes have been saved successfully.
      </AlertDescription>
    </Alert>
  ),
}

// ─── Warning ──────────────────────────────────────────────────────────────────

export const Warning: Story = {
  render: () => (
    <Alert variant="warning" className="w-96">
      <TriangleAlertIcon />
      <AlertTitle>Warning</AlertTitle>
      <AlertDescription>
        This action cannot be undone. Proceed with caution.
      </AlertDescription>
    </Alert>
  ),
}

// ─── Info ─────────────────────────────────────────────────────────────────────

export const Info: Story = {
  render: () => (
    <Alert variant="info" className="w-96">
      <InfoIcon />
      <AlertTitle>Information</AlertTitle>
      <AlertDescription>
        A new version is available. Update to get the latest features.
      </AlertDescription>
    </Alert>
  ),
}

// ─── With Icon ────────────────────────────────────────────────────────────────

export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-96">
      <Alert>
        <TerminalIcon />
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>
          You can add components and dependencies to your app using the CLI.
        </AlertDescription>
      </Alert>
      <Alert variant="info">
        <InfoIcon />
        <AlertTitle>New update available</AlertTitle>
        <AlertDescription>
          Version 2.1.0 is now available. Update to get the latest features.
        </AlertDescription>
      </Alert>
      <Alert variant="warning">
        <TriangleAlertIcon />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          This action cannot be undone. Proceed with caution.
        </AlertDescription>
      </Alert>
    </div>
  ),
}

// ─── All Variants ─────────────────────────────────────────────────────────────

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-96">
      <Alert>
        <InfoIcon />
        <AlertTitle>Default</AlertTitle>
        <AlertDescription>This is a default informational alert.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>Destructive</AlertTitle>
        <AlertDescription>Something went wrong. Please try again.</AlertDescription>
      </Alert>
      <Alert variant="success">
        <CheckCircle2Icon />
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>Operation completed successfully.</AlertDescription>
      </Alert>
      <Alert variant="warning">
        <TriangleAlertIcon />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>Please review before proceeding.</AlertDescription>
      </Alert>
      <Alert variant="info">
        <InfoIcon />
        <AlertTitle>Info</AlertTitle>
        <AlertDescription>Here is some useful information.</AlertDescription>
      </Alert>
    </div>
  ),
}
