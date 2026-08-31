import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'

const meta = {
  title: 'BSystem/Resizable',
  component: ResizablePanelGroup,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ResizablePanelGroup>

export default meta
type Story = StoryObj<typeof meta>

// ─── Horizontal ───────────────────────────────────────────────────────────────

export const Horizontal: Story = {
  render: () => (
    <ResizablePanelGroup
      direction="horizontal"
      className="min-h-48 max-w-md rounded-lg border"
    >
      <ResizablePanel defaultSize={50}>
        <div className="flex h-full items-center justify-center p-6">
          <span className="text-sm text-muted-foreground">Panel One</span>
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={50}>
        <div className="flex h-full items-center justify-center p-6">
          <span className="text-sm text-muted-foreground">Panel Two</span>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
}

// ─── With Handle Grip ────────────────────────────────────────────────────────

export const WithHandleGrip: Story = {
  render: () => (
    <ResizablePanelGroup
      direction="horizontal"
      className="min-h-48 max-w-md rounded-lg border"
    >
      <ResizablePanel defaultSize={25}>
        <div className="flex h-full items-center justify-center p-4">
          <span className="text-sm text-muted-foreground">Sidebar</span>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={75}>
        <div className="flex h-full items-center justify-center p-4">
          <span className="text-sm text-muted-foreground">Main content</span>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
}

// ─── Vertical ─────────────────────────────────────────────────────────────────

export const Vertical: Story = {
  render: () => (
    <ResizablePanelGroup
      direction="vertical"
      className="min-h-64 max-w-xs rounded-lg border"
    >
      <ResizablePanel defaultSize={50}>
        <div className="flex h-full items-center justify-center p-6">
          <span className="text-sm text-muted-foreground">Top</span>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={50}>
        <div className="flex h-full items-center justify-center p-6">
          <span className="text-sm text-muted-foreground">Bottom</span>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
}

// ─── Three Panels ─────────────────────────────────────────────────────────────

export const ThreePanels: Story = {
  render: () => (
    <ResizablePanelGroup
      direction="horizontal"
      className="min-h-48 max-w-lg rounded-lg border"
    >
      <ResizablePanel defaultSize={20}>
        <div className="flex h-full items-center justify-center p-4">
          <span className="text-xs text-muted-foreground">Nav</span>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={60}>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={60}>
            <div className="flex h-full items-center justify-center p-4">
              <span className="text-sm text-muted-foreground">Editor</span>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={40}>
            <div className="flex h-full items-center justify-center p-4">
              <span className="text-xs text-muted-foreground">Terminal</span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={20}>
        <div className="flex h-full items-center justify-center p-4">
          <span className="text-xs text-muted-foreground">Inspector</span>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
}
