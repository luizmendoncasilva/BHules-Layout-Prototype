import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ArrowRightIcon, ExternalLinkIcon, DownloadIcon } from 'lucide-react'

import { LinkButton } from '@/components/ui/link-button'

const meta = {
  title: 'BSystem/LinkButton',
  component: LinkButton,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof LinkButton>

export default meta
type Story = StoryObj<typeof meta>

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => <LinkButton>Learn more</LinkButton>,
}

// ─── Variants ─────────────────────────────────────────────────────────────────

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <LinkButton variant="default">Default link</LinkButton>
      <LinkButton variant="secondary">Secondary link</LinkButton>
    </div>
  ),
}

// ─── With Trailing Icon ───────────────────────────────────────────────────────

export const WithTrailingIcon: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <LinkButton>
        Go to dashboard <ArrowRightIcon className="size-3.5" />
      </LinkButton>
      <LinkButton>
        Open in new tab <ExternalLinkIcon className="size-3.5" />
      </LinkButton>
      <LinkButton>
        Download report <DownloadIcon className="size-3.5" />
      </LinkButton>
    </div>
  ),
}

// ─── In Context ───────────────────────────────────────────────────────────────

export const InContext: Story = {
  render: () => (
    <p className="text-sm text-muted-foreground max-w-xs">
      By continuing, you agree to our{' '}
      <LinkButton>Terms of Service</LinkButton> and{' '}
      <LinkButton>Privacy Policy</LinkButton>.
    </p>
  ),
}

// ─── Disabled ─────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <LinkButton>Active link</LinkButton>
      <LinkButton disabled>Disabled link</LinkButton>
    </div>
  ),
}
