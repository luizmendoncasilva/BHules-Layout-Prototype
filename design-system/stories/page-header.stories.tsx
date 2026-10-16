import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import * as React from 'react'
import { PageHeader } from '@/components/sidebar/page-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { CurrentDateTime } from '@/components/sidebar/current-datetime'
import { NotificationBell } from '@/components/sidebar/notification-bell'
import { mockNotifications } from '@/components/sidebar/notification-config'

const fixedDate = new Date('2026-06-05T16:32:00')

function DemoBreadcrumb({ page = 'Página inicial' }: { page?: string }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Plataforma</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{page}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

function DemoActions() {
  const [notifications, setNotifications] = React.useState(mockNotifications)

  return (
    <>
      <CurrentDateTime date={fixedDate} />
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
  )
}

const meta = {
  title: 'BSystem/PageHeader',
  component: PageHeader,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof PageHeader>

export default meta
type Story = StoryObj<typeof meta>

// ─── Default ─────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => (
    <SidebarProvider>
      <SidebarInset>
        <PageHeader actions={<DemoActions />}>
          <DemoBreadcrumb />
        </PageHeader>
      </SidebarInset>
    </SidebarProvider>
  ),
}

// ─── Responsive (narrow container) ───────────────────────────────────────────

/**
 * Em larguras reduzidas o header cresce em altura e os itens quebram para a
 * próxima linha, em vez de serem cortados. Redimensione o container para ver
 * as ações migrarem para uma segunda linha.
 */
export const Responsive: Story = {
  render: () => (
    <div className="w-[420px] max-w-full border border-dashed border-border">
      <SidebarProvider>
        <SidebarInset>
          <PageHeader actions={<DemoActions />}>
            <DemoBreadcrumb page="Documentos e relatórios" />
          </PageHeader>
        </SidebarInset>
      </SidebarProvider>
    </div>
  ),
}

// ─── Without Trigger ─────────────────────────────────────────────────────────

export const WithoutTrigger: Story = {
  render: () => (
    <SidebarProvider>
      <SidebarInset>
        <PageHeader showTrigger={false} actions={<DemoActions />}>
          <DemoBreadcrumb />
        </PageHeader>
      </SidebarInset>
    </SidebarProvider>
  ),
}

// ─── Dark Mode ───────────────────────────────────────────────────────────────

export const DarkMode: Story = {
  render: () => (
    <div className="dark bg-background text-foreground">
      <SidebarProvider>
        <SidebarInset>
          <PageHeader actions={<DemoActions />}>
            <DemoBreadcrumb />
          </PageHeader>
        </SidebarInset>
      </SidebarProvider>
    </div>
  ),
}
