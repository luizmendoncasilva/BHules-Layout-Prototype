import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import {
  FileTextIcon,
  FolderOpenIcon,
  SearchIcon,
  ShoppingCartIcon,
  UsersIcon,
} from 'lucide-react'

import { Empty } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'

const meta = {
  title: 'BSystem/Empty',
  component: Empty,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Empty>

export default meta
type Story = StoryObj<typeof meta>

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => <Empty />,
}

// ─── With Description ─────────────────────────────────────────────────────────

export const WithDescription: Story = {
  render: () => (
    <Empty
      title="No files found"
      description="Upload a file to get started or adjust your search filters."
    />
  ),
}

// ─── With Action ──────────────────────────────────────────────────────────────

export const WithAction: Story = {
  render: () => (
    <Empty
      title="No results found"
      description="Try adjusting your search terms or filters."
      action={<Button>Clear filters</Button>}
    />
  ),
}

// ─── Custom Icon ──────────────────────────────────────────────────────────────

export const CustomIcon: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <Empty
        icon={<SearchIcon />}
        title="No search results"
        description="We couldn't find anything matching your query."
      />
      <Empty
        icon={<FolderOpenIcon />}
        title="This folder is empty"
        description="Add files here to see them listed."
      />
      <Empty
        icon={<UsersIcon />}
        title="No team members"
        description="Invite colleagues to collaborate on this project."
        action={<Button>Invite members</Button>}
      />
    </div>
  ),
}

// ─── No Icon ──────────────────────────────────────────────────────────────────

export const NoIcon: Story = {
  render: () => (
    <Empty
      icon={null}
      title="Nothing here yet"
      description="Come back later or create something new."
      action={<Button variant="outline">Create new</Button>}
    />
  ),
}

// ─── Contextual Examples ──────────────────────────────────────────────────────

export const ContextualExamples: Story = {
  render: () => (
    <div className="flex flex-col gap-8 divide-y">
      <Empty
        icon={<ShoppingCartIcon />}
        title="Your cart is empty"
        description="Browse products and add items to your cart."
        action={<Button>Browse products</Button>}
      />
      <div className="pt-8">
        <Empty
          icon={<FileTextIcon />}
          title="No invoices yet"
          description="Your invoices will appear here once you make a purchase."
        />
      </div>
    </div>
  ),
}
