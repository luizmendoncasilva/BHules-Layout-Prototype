import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import * as React from 'react'

import {
  NotificationBell,
} from '@/components/sidebar/notification-bell'
import { mockNotifications } from '@/components/sidebar/notification-config'

const meta = {
  title: 'BSystem/NotificationBell',
  component: NotificationBell,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof NotificationBell>

export default meta
type Story = StoryObj<typeof meta>

// ─── Without Notification ───────────────────────────────────────────────────

/** Sino sem indicador de não lidas, com menu aberto exibindo empty state. */
export const WithoutNotification: Story = {
  render: () => (
    <NotificationBell defaultOpen notifications={[]} />
  ),
}

// ─── With Notification ──────────────────────────────────────────────────────

/** Ícone com indicador pulsante quando há notificações não lidas. */
export const WithNotification: Story = {
  render: () => <NotificationBell notifications={mockNotifications} />,
}

// ─── Hover ──────────────────────────────────────────────────────────────────

/** Estado visual de hover no botão do sino. */
export const Hover: Story = {
  render: () => (
    <NotificationBell
      notifications={mockNotifications}
      className="bg-[var(--unofficial-ghost-hover)]"
    />
  ),
}

// ─── Opened ─────────────────────────────────────────────────────────────────

/** Menu aberto com lista de notificações e itens interativos. */
export const Opened: Story = {
  render: function Render() {
    const [notifications, setNotifications] = React.useState(mockNotifications)

    return (
      <NotificationBell
        defaultOpen
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
    )
  },
}

// ─── Empty ──────────────────────────────────────────────────────────────────

/** Estado vazio quando não há notificações. */
export const Empty: Story = {
  render: () => <NotificationBell notifications={[]} />,
}

// ─── Playground ───────────────────────────────────────────────────────────────

/** Versão interativa com abertura do menu e marcação de lidas. */
export const Playground: Story = {
  render: function Render() {
    const [notifications, setNotifications] = React.useState(mockNotifications)

    return (
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
    )
  },
}
