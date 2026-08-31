import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import {
  LayoutDashboardIcon,
  UsersIcon,
  BarChartIcon,
  SettingsIcon,
  FileTextIcon,
  FolderIcon,
  InboxIcon,
  StarIcon,
  PlusIcon,
  MoreHorizontalIcon,
  ChevronRightIcon,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar'

/** Reusable sidebar content for theme stories */
function SidebarDemo() {
  return (
    <>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" isActive>
              <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg text-sm font-bold shrink-0">
                B
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">BHub</span>
                <span className="text-xs text-muted-foreground">Design System</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {(
                [
                  { icon: LayoutDashboardIcon, label: 'Dashboard', active: true, badge: undefined },
                  { icon: InboxIcon, label: 'Inbox', active: false, badge: '5' },
                  { icon: FileTextIcon, label: 'Documents', active: false, badge: undefined },
                  { icon: FolderIcon, label: 'Projects', active: false, badge: undefined },
                ] as const
              ).map(({ icon: Icon, label, active, badge }) => (
                <SidebarMenuItem key={label}>
                  <SidebarMenuButton isActive={active}>
                    <Icon />
                    <span>{label}</span>
                  </SidebarMenuButton>
                  {badge && <SidebarMenuBadge>{badge}</SidebarMenuBadge>}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Team</SidebarGroupLabel>
          <SidebarGroupAction aria-label="Add team member">
            <PlusIcon />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {(
                [
                  { icon: UsersIcon, label: 'Members' },
                  { icon: BarChartIcon, label: 'Analytics' },
                  { icon: SettingsIcon, label: 'Settings' },
                ] as const
              ).map(({ icon: Icon, label }) => (
                <SidebarMenuItem key={label}>
                  <SidebarMenuButton>
                    <Icon />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="bg-muted size-8 rounded-full shrink-0 flex items-center justify-center text-xs font-medium">
                AM
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Arthur Moreira</span>
                <span className="text-xs text-muted-foreground">arthur@bhub.com.br</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  )
}

const meta = {
  title: 'BSystem/Sidebar',
  component: Sidebar,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="overflow-hidden">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Sidebar>

export default meta
type Story = StoryObj<typeof meta>

// ─── Default ─────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" isActive>
                <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg text-sm font-bold shrink-0">
                  B
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">BHub</span>
                  <span className="text-xs text-muted-foreground">Design System</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {(
                  [
                    { icon: LayoutDashboardIcon, label: 'Dashboard', active: true, badge: undefined },
                    { icon: InboxIcon, label: 'Inbox', active: false, badge: '5' },
                    { icon: FileTextIcon, label: 'Documents', active: false, badge: undefined },
                    { icon: FolderIcon, label: 'Projects', active: false, badge: undefined },
                  ] as const
                ).map(({ icon: Icon, label, active, badge }) => (
                  <SidebarMenuItem key={label}>
                    <SidebarMenuButton isActive={active}>
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                    {badge && <SidebarMenuBadge>{badge}</SidebarMenuBadge>}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupLabel>Team</SidebarGroupLabel>
            <SidebarGroupAction aria-label="Add team member">
              <PlusIcon />
            </SidebarGroupAction>
            <SidebarGroupContent>
              <SidebarMenu>
                {(
                  [
                    { icon: UsersIcon, label: 'Members' },
                    { icon: BarChartIcon, label: 'Analytics' },
                    { icon: SettingsIcon, label: 'Settings' },
                  ] as const
                ).map(({ icon: Icon, label }) => (
                  <SidebarMenuItem key={label}>
                    <SidebarMenuButton>
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg">
                <div className="bg-muted size-8 rounded-full shrink-0 flex items-center justify-center text-xs font-medium">
                  AM
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Arthur Moreira</span>
                  <span className="text-xs text-muted-foreground">arthur@bhub.com.br</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <span className="text-sm font-medium">Dashboard</span>
        </header>
        <div className="p-6">
          <p className="text-sm text-muted-foreground">Main content area.</p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  ),
}

// ─── With Submenu ─────────────────────────────────────────────────────────────

export const WithSubmenu: Story = {
  render: () => (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive>
                    <LayoutDashboardIcon />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <FolderIcon />
                    <span>Projects</span>
                    <ChevronRightIcon className="ml-auto size-4 transition-transform" />
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton href="#" isActive>
                        BSystem
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton href="#">
                        BHub App
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton href="#">
                        Marketing Site
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <UsersIcon />
                    <span>Team</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <span className="text-sm font-medium">Projects / BSystem</span>
        </header>
        <div className="p-6">
          <p className="text-sm text-muted-foreground">Content with submenu navigation.</p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  ),
}

// ─── With Actions ─────────────────────────────────────────────────────────────

export const WithActions: Story = {
  render: () => (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Starred</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {(['BSystem', 'Marketing Site', 'API Docs', 'Design Tokens'] as const).map(
                  (item) => (
                    <SidebarMenuItem key={item}>
                      <SidebarMenuButton>
                        <StarIcon />
                        <span>{item}</span>
                      </SidebarMenuButton>
                      <SidebarMenuAction showOnHover>
                        <MoreHorizontalIcon />
                      </SidebarMenuAction>
                    </SidebarMenuItem>
                  )
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <span className="text-sm font-medium">Starred</span>
        </header>
        <div className="p-6">
          <p className="text-sm text-muted-foreground">Hover over items to see actions.</p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  ),
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

export const LoadingSkeleton: Story = {
  render: () => (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Loading…</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuSkeleton showIcon />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <span className="text-sm font-medium">Loading state</span>
        </header>
        <div className="p-6">
          <p className="text-sm text-muted-foreground">Sidebar skeleton while data loads.</p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  ),
}

// ─── Collapsible Icon ─────────────────────────────────────────────────────────

export const CollapsibleIcon: Story = {
  render: () => (
    <SidebarProvider defaultOpen={false}>
      <Sidebar collapsible="icon">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {(
                  [
                    { icon: LayoutDashboardIcon, label: 'Dashboard', active: true },
                    { icon: InboxIcon, label: 'Inbox', active: false },
                    { icon: UsersIcon, label: 'Team', active: false },
                    { icon: BarChartIcon, label: 'Analytics', active: false },
                    { icon: SettingsIcon, label: 'Settings', active: false },
                  ] as const
                ).map(({ icon: Icon, label, active }) => (
                  <SidebarMenuItem key={label}>
                    <SidebarMenuButton isActive={active} tooltip={label}>
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <span className="text-sm font-medium">Icon-collapsible sidebar</span>
        </header>
        <div className="p-6">
          <p className="text-sm text-muted-foreground">
            Toggle the sidebar to see icon-only mode. Hover icons for tooltips.
          </p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  ),
}

// ─── Light Mode ──────────────────────────────────────────────────────────────

export const LightMode: Story = {
  render: () => (
    <SidebarProvider>
      <Sidebar>
        <SidebarDemo />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <span className="text-sm font-medium">Light Mode</span>
        </header>
        <div className="p-6">
          <p className="text-sm text-muted-foreground">Sidebar em modo claro.</p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  ),
}

// ─── Dark Mode ───────────────────────────────────────────────────────────────

export const DarkMode: Story = {
  render: () => (
    <div className="dark bg-background text-foreground">
      <SidebarProvider>
        <Sidebar>
          <SidebarDemo />
        </Sidebar>
        <SidebarInset>
          <header className="flex h-14 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <span className="text-sm font-medium">Dark Mode</span>
          </header>
          <div className="p-6">
            <p className="text-sm text-muted-foreground">Sidebar em modo escuro.</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  ),
}
