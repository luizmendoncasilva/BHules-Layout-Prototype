import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { toast } from 'sonner'

import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'

const meta = {
  title: 'BSystem/Sonner',
  component: Toaster,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
} satisfies Meta<typeof Toaster>

export default meta
type Story = StoryObj<typeof meta>

// ─── All Types ────────────────────────────────────────────────────────────────

export const AllTypes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 justify-center">
      <Button
        variant="outline"
        onClick={() => toast('Event has been created')}
      >
        Default
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.success('Profile saved', {
            description: 'Your changes have been saved successfully.',
          })
        }
      >
        Success
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.error('Something went wrong', {
            description: 'Please try again or contact support.',
          })
        }
      >
        Error
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.warning('Low balance', {
            description: 'Your account balance is below R$ 100.',
          })
        }
      >
        Warning
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.info('New feature available', {
            description: "Check out what's new in this release.",
          })
        }
      >
        Info
      </Button>
    </div>
  ),
}

// ─── With Description ─────────────────────────────────────────────────────────

export const WithDescription: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 justify-center">
      <Button
        onClick={() =>
          toast('Invoice sent', {
            description: 'Invoice #1042 was sent to client@acme.com.',
          })
        }
      >
        With description
      </Button>
    </div>
  ),
}

// ─── With Action ──────────────────────────────────────────────────────────────

export const WithAction: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 justify-center">
      <Button
        onClick={() =>
          toast('Transaction deleted', {
            description: 'The transaction was removed.',
            action: {
              label: 'Undo',
              onClick: () => toast.success('Transaction restored'),
            },
          })
        }
      >
        With action (undo)
      </Button>
    </div>
  ),
}

// ─── Promise ──────────────────────────────────────────────────────────────────

const fakeUpload = (): globalThis.Promise<{ name: string }> =>
  new globalThis.Promise((resolve) =>
    setTimeout(() => resolve({ name: 'report.pdf' }), 2000)
  )

export const PromiseToast: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 justify-center">
      <Button
        onClick={() =>
          toast.promise(fakeUpload(), {
            loading: 'Generating report…',
            success: (data: { name: string }) =>
              `${data.name} is ready to download.`,
            error: 'Failed to generate report.',
          })
        }
      >
        Promise toast (2s)
      </Button>
    </div>
  ),
}

// ─── Loading ──────────────────────────────────────────────────────────────────

export const Loading: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 justify-center">
      <Button
        variant="outline"
        onClick={() => {
          const id = toast.loading('Processing payment…')
          setTimeout(() => {
            toast.success('Payment confirmed', { id, description: 'R$ 1.500,00 was charged.' })
          }, 3000)
        }}
      >
        Loading → Success (3s)
      </Button>
    </div>
  ),
}

// ─── Positions ────────────────────────────────────────────────────────────────

export const Positions: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 justify-center">
      {(
        [
          'top-left',
          'top-center',
          'top-right',
          'bottom-left',
          'bottom-center',
          'bottom-right',
        ] as const
      ).map((position) => (
        <Button
          key={position}
          variant="outline"
          size="sm"
          onClick={() =>
            toast(`Toast at ${position}`, { position })
          }
        >
          {position}
        </Button>
      ))}
    </div>
  ),
}
