"use client"

import * as React from "react"
import { BellIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty } from "@/components/ui/empty"
import { IconButton } from "@/components/ui/icon-button"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { NotificationDot } from "@/components/sidebar/notification-dot"
import type { Notification } from "@/components/sidebar/notification-config"

type NotificationBellProps = {
  /** Notification list from your API — defaults to empty when omitted */
  notifications?: Notification[]
  className?: string
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onNotificationClick?: (notification: Notification) => void
  onMarkAllRead?: () => void
}

function NotificationBellItem({
  notification,
  onClick,
}: {
  notification: Notification
  onClick?: (notification: Notification) => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      data-slot="notification-bell-item"
      className={cn(
        "h-auto w-full min-w-0 items-start justify-start gap-3 rounded-md px-3 py-2.5 text-left font-normal whitespace-normal",
        !notification.read && "bg-muted/60"
      )}
      onClick={() => onClick?.(notification)}
    >
      <NotificationDot
        show={!notification.read}
        className="mt-1.5"
      />
      <span className="min-w-0 flex-1 overflow-hidden">
        <span className="block text-sm font-medium text-foreground break-words">
          {notification.title}
        </span>
        {notification.description && (
          <span className="mt-0.5 block line-clamp-2 text-xs text-muted-foreground break-words">
            {notification.description}
          </span>
        )}
        <span className="mt-1 block text-xs text-muted-foreground">
          {notification.time}
        </span>
      </span>
    </Button>
  )
}

function NotificationBell({
  notifications = [],
  className,
  open,
  defaultOpen,
  onOpenChange,
  onNotificationClick,
  onMarkAllRead,
}: NotificationBellProps) {
  const unreadCount = notifications.filter((notification) => !notification.read).length
  const hasUnread = unreadCount > 0

  return (
    <Popover open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <IconButton
          variant="ghost"
          size="default"
          aria-label={
            hasUnread
              ? `Notificações (${unreadCount} não lidas)`
              : "Notificações"
          }
          data-slot="notification-bell-trigger"
          className={cn(
            "relative",
            "data-[state=open]:bg-[var(--unofficial-ghost-hover)]",
            className
          )}
        >
          <BellIcon />
          {hasUnread && (
            <NotificationDot
              pulse
              className="absolute top-1.5 right-1.5"
            />
          )}
        </IconButton>
      </PopoverTrigger>

      <PopoverContent
        data-slot="notification-bell-content"
        align="end"
        sideOffset={8}
        className="w-80 overflow-x-hidden p-0"
      >
        <PopoverHeader className="flex-row items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-2">
            <PopoverTitle className="text-sm font-semibold text-foreground">
              Notificações
            </PopoverTitle>
            {hasUnread && (
              <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          {hasUnread && onMarkAllRead && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              data-slot="notification-bell-mark-all"
              className="text-muted-foreground hover:text-foreground"
              onClick={onMarkAllRead}
            >
              Marcar todas como lidas
            </Button>
          )}
        </PopoverHeader>

        <Separator />

        {notifications.length === 0 ? (
          <Empty
            icon={<BellIcon />}
            title="Nenhuma notificação"
            description="Você está em dia. Novas atualizações aparecerão aqui."
            className="py-10"
          />
        ) : (
          <ScrollArea className="max-h-80 overflow-x-hidden">
            <div className="flex min-w-0 flex-col gap-0.5 p-1">
              {notifications.map((notification) => (
                <NotificationBellItem
                  key={notification.id}
                  notification={notification}
                  onClick={onNotificationClick}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  )
}

export {
  NotificationBell,
  NotificationBellItem,
}
export type { Notification, NotificationBellProps }
