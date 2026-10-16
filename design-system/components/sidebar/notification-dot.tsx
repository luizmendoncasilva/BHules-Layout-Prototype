"use client"

import { cn } from "@/lib/utils"

type NotificationDotProps = {
  /** Renders the unread dot. When false, keeps layout spacing. */
  show?: boolean
  /** Adds the pulsing ring animation for active indicators. */
  pulse?: boolean
  className?: string
}

function NotificationDot({
  show = true,
  pulse = false,
  className,
}: NotificationDotProps) {
  if (!show) {
    return (
      <span
        data-slot="notification-dot"
        aria-hidden
        className={cn("size-2 shrink-0", className)}
      />
    )
  }

  return (
    <span
      data-slot="notification-dot"
      className={cn(
        "relative flex size-2 shrink-0 items-center justify-center",
        className
      )}
    >
      {pulse && (
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-sidebar-info opacity-40" />
      )}
      <span className="relative inline-flex size-2 rounded-full bg-sidebar-info" />
    </span>
  )
}

export { NotificationDot }
export type { NotificationDotProps }
