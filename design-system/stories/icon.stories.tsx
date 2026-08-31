import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import {
  AlertTriangleIcon,
  BellIcon,
  CheckCircleIcon,
  HeartIcon,
  InfoIcon,
  SearchIcon,
  SettingsIcon,
  StarIcon,
} from 'lucide-react'

import { Icon } from '@/components/ui/icon'

const iconOptions = {
  Search: SearchIcon,
  Bell: BellIcon,
  Settings: SettingsIcon,
  Star: StarIcon,
  Info: InfoIcon,
  Warning: AlertTriangleIcon,
  Success: CheckCircleIcon,
  Heart: HeartIcon,
}

const meta = {
  title: 'BSystem/Icon',
  component: Icon,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    // Map icon component to a friendly select control so docs/Playground render
    // a clean dropdown instead of dumping the forwardRef JSON.
    icon: {
      control: { type: 'select' },
      options: Object.keys(iconOptions),
      mapping: iconOptions,
      description:
        'Lucide icon component to render. Restricts icon usage to the design system set.',
      table: { type: { summary: 'LucideIcon' } },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'xl'],
    },
    color: {
      control: 'select',
      options: ['black', 'neutral'],
    },
  },
  args: {
    icon: 'Search' as unknown as typeof SearchIcon,
    size: 'md',
    color: 'black',
  },
} satisfies Meta<typeof Icon>

export default meta
type Story = StoryObj<typeof meta>

// ─── Playground ──────────────────────────────────────────────────────────────

export const Playground: Story = {}

// ─── Sizes ───────────────────────────────────────────────────────────────────

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      {(['sm', 'md', 'xl'] as const).map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <Icon icon={SettingsIcon} size={size} />
          <span className="text-xs text-muted-foreground">{size}</span>
        </div>
      ))}
    </div>
  ),
}

// ─── Colors ──────────────────────────────────────────────────────────────────

export const Colors: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      {(['black', 'neutral'] as const).map((color) => (
        <div key={color} className="flex flex-col items-center gap-2">
          <Icon icon={HeartIcon} color={color} size="xl" />
          <span className="text-xs text-muted-foreground">{color}</span>
        </div>
      ))}
    </div>
  ),
}

// ─── Gallery ─────────────────────────────────────────────────────────────────

export const Gallery: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-6">
      {Object.entries(iconOptions).map(([label, icon]) => (
        <div key={label} className="flex flex-col items-center gap-2">
          <Icon icon={icon} size="xl" />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  ),
}
