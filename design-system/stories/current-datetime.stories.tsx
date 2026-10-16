import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { CurrentDateTime } from '@/components/sidebar/current-datetime'
import { mockCurrentDateTime } from '@/components/sidebar/datetime-config'

const meta = {
  title: 'BSystem/CurrentDateTime',
  component: CurrentDateTime,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof CurrentDateTime>

export default meta
type Story = StoryObj<typeof meta>

/** Data e hora fixas para preview consistente no Storybook. */
export const Mock: Story = {
  args: {
    date: mockCurrentDateTime,
  },
}

/** Relógio ao vivo — atualiza a cada minuto. */
export const Live: Story = {
  render: () => <CurrentDateTime />,
}
