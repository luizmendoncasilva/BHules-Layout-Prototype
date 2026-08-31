import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import * as React from 'react'

import { LoadingButton } from '@/components/ui/loading-button'

const meta = {
  title: 'BSystem/LoadingButton',
  component: LoadingButton,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof LoadingButton>

export default meta
type Story = StoryObj<typeof meta>

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => <LoadingButton>Save changes</LoadingButton>,
}

// ─── Loading State ────────────────────────────────────────────────────────────

export const Loading: Story = {
  render: () => <LoadingButton loading>Save changes</LoadingButton>,
}

// ─── Loading With Custom Text ─────────────────────────────────────────────────

export const LoadingWithText: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <LoadingButton loading loadingText="Saving...">
        Save changes
      </LoadingButton>
      <LoadingButton loading loadingText="Submitting...">
        Submit form
      </LoadingButton>
      <LoadingButton loading loadingText="Uploading...">
        Upload file
      </LoadingButton>
    </div>
  ),
}

// ─── All Variants ─────────────────────────────────────────────────────────────

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {(['default', 'secondary', 'outline', 'ghost', 'destructive'] as const).map(
        (variant) => (
          <div key={variant} className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground w-24">{variant}</span>
            <LoadingButton variant={variant}>Idle</LoadingButton>
            <LoadingButton variant={variant} loading loadingText="Loading...">
              Idle
            </LoadingButton>
          </div>
        )
      )}
    </div>
  ),
}

// ─── Interactive Toggle ────────────────────────────────────────────────────────

function InteractiveDemo() {
  const [loading, setLoading] = React.useState(false)

  const handleClick = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 2000)
  }

  return (
    <LoadingButton loading={loading} loadingText="Processing..." onClick={handleClick}>
      Click me
    </LoadingButton>
  )
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
}
