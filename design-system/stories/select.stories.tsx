import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

const meta = {
  title: 'BSystem/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'By default the Select is **deselectable**: clicking the option that is already ' +
          'selected clears it and returns the field to its placeholder (empty) state. ' +
          'Pass `isDeselectable={false}` to disable this — useful for required fields where ' +
          'clearing should not be offered.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

// ─── Playground ──────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="cherry">Cherry</SelectItem>
      </SelectContent>
    </Select>
  ),
}

// ─── Sizes ───────────────────────────────────────────────────────────────────

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">sm</span>
        <Select>
          <SelectTrigger size="sm" className="w-40">
            <SelectValue placeholder="Small" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
            <SelectItem value="b">Option B</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">default</span>
        <Select>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Default" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
            <SelectItem value="b">Option B</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  ),
}

// ─── With Groups ─────────────────────────────────────────────────────────────

export const WithGroups: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Tropical</SelectLabel>
          <SelectItem value="mango">Mango</SelectItem>
          <SelectItem value="pineapple">Pineapple</SelectItem>
          <SelectItem value="papaya">Papaya</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Berries</SelectLabel>
          <SelectItem value="strawberry">Strawberry</SelectItem>
          <SelectItem value="blueberry">Blueberry</SelectItem>
          <SelectItem value="raspberry">Raspberry</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
}

// ─── States ──────────────────────────────────────────────────────────────────

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-3 items-start">
      <Select>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Default" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
          <SelectItem value="b">Option B</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="b">
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
          <SelectItem value="b">Option B (selected)</SelectItem>
        </SelectContent>
      </Select>
      <Select disabled>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Disabled" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}

// ─── Deselectable (default) ────────────────────────────────────────────────────

export const Deselectable: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Default behavior. Open the menu and click **Banana** again to clear the ' +
          'selection — the field returns to its placeholder.',
      },
    },
  },
  render: () => {
    const [value, setValue] = React.useState('banana')
    return (
      <div className="flex w-56 flex-col gap-3">
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="cherry">Cherry</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Current value:{' '}
          <span className="font-medium text-foreground">{value || '(none)'}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Click the selected option again to remove the selection.
        </p>
      </div>
    )
  },
}

// ─── Not Deselectable (required field) ──────────────────────────────────────────

export const NotDeselectable: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'With `isDeselectable={false}` the selected option cannot be cleared by ' +
          're-clicking it. Use this for required fields.',
      },
    },
  },
  render: () => {
    const [value, setValue] = React.useState('banana')
    return (
      <div className="flex w-56 flex-col gap-3">
        <Select value={value} onValueChange={setValue} isDeselectable={false}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="cherry">Cherry</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Current value:{' '}
          <span className="font-medium text-foreground">{value || '(none)'}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Re-clicking the selected option keeps it — clearing is disabled.
        </p>
      </div>
    )
  },
}

// ─── With Label ──────────────────────────────────────────────────────────────

export const WithLabelAndHelper: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-56">
      <Label htmlFor="country">Country</Label>
      <Select>
        <SelectTrigger id="country" className="w-full">
          <SelectValue placeholder="Select your country" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="br">Brazil</SelectItem>
          <SelectItem value="us">United States</SelectItem>
          <SelectItem value="pt">Portugal</SelectItem>
          <SelectItem value="es">Spain</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Used to set your timezone.
      </p>
    </div>
  ),
}
