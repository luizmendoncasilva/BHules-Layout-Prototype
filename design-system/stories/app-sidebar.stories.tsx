import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import {
  HomeIcon,
  ClipboardListIcon,
  FileTextIcon,
  SendIcon,
  BuildingIcon,
  CircleHelpIcon,
} from 'lucide-react'

import * as React from 'react'
import { AppSidebar, defaultUpdateCard } from '@/components/ui/app-sidebar'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { CurrentDateTime } from '@/components/sidebar/current-datetime'
import { PageHeader } from '@/components/sidebar/page-header'
import {
  NotificationBell,
} from '@/components/sidebar/notification-bell'
import { mockNotifications } from '@/components/sidebar/notification-config'
import { WorkspaceSwitcher, type Workspace } from '@/components/sidebar/workspace-switcher'
import { NavMain } from '@/components/sidebar/nav-main'
import type { NavGroup } from '@/components/sidebar/nav-config'

function InsetContent({
  title = 'Dashboard',
  rows,
}: {
  title?: string
  /** When set, renders N stacked blocks to demonstrate internal scrolling. */
  rows?: number
}) {
  const [notifications, setNotifications] = React.useState(mockNotifications)

  return (
    <SidebarInset>
      <PageHeader
        actions={
          <>
            <CurrentDateTime />
            <NotificationBell
              notifications={notifications}
              onNotificationClick={(notification) => {
                setNotifications((current) =>
                  current.map((item) =>
                    item.id === notification.id ? { ...item, read: true } : item
                  )
                )
              }}
              onMarkAllRead={() => {
                setNotifications((current) =>
                  current.map((item) => ({ ...item, read: true }))
                )
              }}
            />
          </>
        }
      >
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Plataforma</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>
      <div className="flex flex-1 flex-col gap-4 p-6">
        {rows ? (
          Array.from({ length: rows }).map((_, index) => (
            <div
              key={index}
              className="bg-muted/50 flex h-48 shrink-0 items-center justify-center rounded-xl text-sm text-muted-foreground"
            >
              Bloco {index + 1}
            </div>
          ))
        ) : (
          <>
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
              <div className="bg-muted/50 aspect-video rounded-xl" />
              <div className="bg-muted/50 aspect-video rounded-xl" />
              <div className="bg-muted/50 aspect-video rounded-xl" />
            </div>
            <div className="bg-muted/50 min-h-[50vh] flex-1 rounded-xl" />
          </>
        )}
      </div>
    </SidebarInset>
  )
}

const meta = {
  title: 'BSystem/AppSidebar',
  component: AppSidebar,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof AppSidebar>

export default meta
type Story = StoryObj<typeof meta>

// ─── Default (Light Mode) ───────────────────────────────────────────────────

export const Default: Story = {
  render: () => (
    <SidebarProvider>
      <AppSidebar updateCard={defaultUpdateCard} />
      <InsetContent />
    </SidebarProvider>
  ),
}

// ─── Scrolling Content (frame embraces content) ─────────────────────────────

/** Tall content: the dark frame and its margins stay fixed while only the inset
 * scrolls. The PageHeader stays pinned (sticky) at the top of the inset. */
export const ScrollingContent: Story = {
  render: () => (
    <SidebarProvider>
      <AppSidebar updateCard={defaultUpdateCard} />
      <InsetContent title="Scroll dentro do frame" rows={12} />
    </SidebarProvider>
  ),
}

// ─── Collapsed ──────────────────────────────────────────────────────────────

export const Collapsed: Story = {
  render: () => (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar updateCard={defaultUpdateCard} />
      <InsetContent />
    </SidebarProvider>
  ),
}

// ─── Dark Mode ──────────────────────────────────────────────────────────────

export const DarkMode: Story = {
  render: () => (
    <div className="dark bg-background text-foreground">
      <SidebarProvider>
        <AppSidebar updateCard={defaultUpdateCard} />
        <InsetContent />
      </SidebarProvider>
    </div>
  ),
}

// ─── Dark Mode Collapsed ────────────────────────────────────────────────────

export const DarkModeCollapsed: Story = {
  render: () => (
    <div className="dark bg-background text-foreground">
      <SidebarProvider defaultOpen={false}>
        <AppSidebar updateCard={defaultUpdateCard} />
        <InsetContent />
      </SidebarProvider>
    </div>
  ),
}

// ─── Light vs Dark (Side by Side) ───────────────────────────────────────────

export const LightVsDark: Story = {
  render: () => (
    <div className="flex min-h-svh">
      <div className="flex-1 border-r">
        <SidebarProvider>
          <AppSidebar updateCard={defaultUpdateCard} />
          <InsetContent title="Light Mode" />
        </SidebarProvider>
      </div>
      <div className="flex-1 dark bg-background text-foreground">
        <SidebarProvider>
          <AppSidebar updateCard={defaultUpdateCard} />
          <InsetContent title="Dark Mode" />
        </SidebarProvider>
      </div>
    </div>
  ),
}

// ─── Update Card: Off (no announcement) ─────────────────────────────────────

/** Feature-flag behavior: when `updateCard` is omitted (or `enabled: false`), the announcement card is not rendered. Use this when there are no updates to show. */
export const WithoutUpdateCard: Story = {
  render: () => (
    <SidebarProvider>
      <AppSidebar />
      <InsetContent title="No update card" />
    </SidebarProvider>
  ),
}

// ─── Update Card: Dismissible ───────────────────────────────────────────────

/** When `onDismiss` is provided, the card shows a close button. Here it toggles the card off, mimicking a per-user dismiss. */
export const DismissibleUpdateCard: Story = {
  render: function Render() {
    const [visible, setVisible] = React.useState(true)
    return (
      <SidebarProvider>
        <AppSidebar
          updateCard={
            visible
              ? {
                  ...defaultUpdateCard,
                  cta: 'Ver novidades',
                  onDismiss: () => setVisible(false),
                }
              : undefined
          }
        />
        <InsetContent title="Dismissible update card" />
      </SidebarProvider>
    )
  },
}

// ─── Disabled Items ─────────────────────────────────────────────────────────

const disabledNavGroups: NavGroup[] = [
  {
    label: 'Plataforma',
    items: [
      {
        title: 'Página inicial',
        icon: HomeIcon,
        href: '/',
        isActive: true,
      },
      {
        title: 'Tarefas',
        icon: ClipboardListIcon,
        href: '/tarefas',
        badge: 10,
        disabled: true,
      },
      {
        title: 'Documentos e relatórios',
        icon: FileTextIcon,
        href: '/documentos',
        disabled: true,
      },
      {
        title: 'Solicitações',
        icon: SendIcon,
        href: '/solicitacoes',
        items: [
          {
            title: 'Realizar nova solicitação',
            icon: SendIcon,
            href: '/solicitacoes/nova',
          },
          {
            title: 'Minhas solicitações',
            icon: SendIcon,
            href: '/solicitacoes/minhas',
          },
        ],
      },
    ],
  },
  {
    label: 'Gestão',
    items: [
      {
        title: 'Minha empresa',
        icon: BuildingIcon,
        href: '/empresa',
        disabled: true,
        items: [
          {
            title: 'Gestão de acessos',
            icon: BuildingIcon,
            href: '/empresa/acessos',
          },
          {
            title: 'Contas financeiras',
            icon: BuildingIcon,
            href: '/empresa/contas',
          },
          {
            title: 'Cobranças BHub',
            icon: BuildingIcon,
            href: '/empresa/cobrancas',
          },
        ],
      },
      {
        title: 'Central de Ajuda',
        icon: CircleHelpIcon,
        href: '/ajuda',
      },
    ],
  },
]

/** Demonstrates disabled menu items. Disabled items have `opacity: 50%` and `pointer-events: none`, preventing interaction. Works on both simple items and collapsible parents. */
export const DisabledItems: Story = {
  render: () => (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarContent>
          <NavMain navGroups={disabledNavGroups} />
        </SidebarContent>
      </Sidebar>
      <InsetContent title="Disabled Items Demo" />
    </SidebarProvider>
  ),
}

// ─── Notification Dot ───────────────────────────────────────────────────────

const notificationNavGroups: NavGroup[] = [
  {
    label: 'Plataforma',
    items: [
      {
        title: 'Página inicial',
        icon: HomeIcon,
        href: '/',
        isActive: true,
      },
      {
        title: 'Tarefas',
        icon: ClipboardListIcon,
        href: '/tarefas',
        badge: 10,
      },
      {
        title: 'Documentos e relatórios',
        icon: FileTextIcon,
        href: '/documentos',
        hasNotification: true,
        notificationTooltip: 'Novos arquivos disponíveis',
      },
      {
        title: 'Solicitações',
        icon: SendIcon,
        href: '/solicitacoes',
        items: [
          {
            title: 'Realizar nova solicitação',
            icon: SendIcon,
            href: '/solicitacoes/nova',
          },
          {
            title: 'Minhas solicitações',
            icon: SendIcon,
            href: '/solicitacoes/minhas',
          },
        ],
      },
    ],
  },
]

/** Demonstrates the notification dot indicator. A blue pulsing dot appears on items with `hasNotification: true`. Hover the dot to see a tooltip with the notification message. */
export const NotificationDot: Story = {
  render: () => (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarContent>
          <NavMain navGroups={notificationNavGroups} />
        </SidebarContent>
      </Sidebar>
      <InsetContent title="Notification Dot Demo" />
    </SidebarProvider>
  ),
}

// ─── Workspace Switcher: Few Companies (no search) ──────────────────────────

const fewWorkspaces: Workspace[] = [
  { id: '1', name: 'Efferd', identifier: '12.345.678/0001-90' },
  { id: '2', name: 'Acme Corp', identifier: '98.765.432/0001-10' },
  { id: '3', name: 'Stark Industries', identifier: '11.222.333/0001-44' },
]

/** Up to 5 companies: simple list without search. */
export const WorkspaceFewCompanies: Story = {
  render: function Render() {
    const [active, setActive] = React.useState('1')
    return (
      <SidebarProvider>
        <Sidebar variant="inset" collapsible="icon">
          <SidebarHeader>
            <WorkspaceSwitcher
              workspaces={fewWorkspaces}
              activeWorkspaceId={active}
              onWorkspaceChange={setActive}
            />
          </SidebarHeader>
        </Sidebar>
        <InsetContent title="Few Companies" />
      </SidebarProvider>
    )
  },
}

// ─── Workspace Switcher: Many Companies (with search + scroll) ──────────────

const manyWorkspaces: Workspace[] = [
  { id: '1', name: 'Efferd Tecnologia', identifier: '12.345.678/0001-90' },
  { id: '2', name: 'Acme Corp', identifier: '98.765.432/0001-10' },
  { id: '3', name: 'Stark Industries', identifier: '11.222.333/0001-44' },
  { id: '4', name: 'Wayne Enterprises', identifier: '22.333.444/0001-55' },
  { id: '5', name: 'Oscorp Industries', identifier: '33.444.555/0001-66' },
  { id: '6', name: 'Umbrella Corporation', identifier: '44.555.666/0001-77' },
  { id: '7', name: 'Cyberdyne Systems', identifier: '55.666.777/0001-88' },
  { id: '8', name: 'Soylent Corp', identifier: '66.777.888/0001-99' },
  { id: '9', name: 'Tyrell Corporation', identifier: '77.888.999/0001-00' },
  { id: '10', name: 'Weyland-Yutani', identifier: '88.999.000/0001-11' },
  { id: '11', name: 'Initech Solutions', identifier: '99.000.111/0001-22' },
  { id: '12', name: 'Globex Corporation', identifier: '00.111.222/0001-33' },
]

/** More than 5 companies: shows search input and scrollable list. Filter by name or CNPJ. */
export const WorkspaceManyCompanies: Story = {
  render: function Render() {
    const [active, setActive] = React.useState('1')
    return (
      <SidebarProvider>
        <Sidebar variant="inset" collapsible="icon">
          <SidebarHeader>
            <WorkspaceSwitcher
              workspaces={manyWorkspaces}
              activeWorkspaceId={active}
              onWorkspaceChange={setActive}
            />
          </SidebarHeader>
        </Sidebar>
        <InsetContent title="Many Companies (search + scroll)" />
      </SidebarProvider>
    )
  },
}
