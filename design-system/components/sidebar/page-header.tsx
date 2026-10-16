"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { SidebarTrigger } from "@/components/ui/sidebar"

type PageHeaderProps = React.ComponentProps<"header"> & {
  /** Render the built-in SidebarTrigger on the left. @default true */
  showTrigger?: boolean
  /** Right-aligned actions area (e.g. CurrentDateTime, NotificationBell). */
  actions?: React.ReactNode
}

function PageHeader({
  showTrigger = true,
  actions,
  className,
  children,
  ...props
}: PageHeaderProps) {
  return (
    <header
      data-slot="page-header"
      className={cn(
        // sticky: stays pinned to the top of the inset scroll container while
        // the content below scrolls. bg-background keeps it opaque over content.
        "sticky top-0 z-10 shrink-0 bg-background",
        // min-h + flex-wrap: when content does not fit on a single line the
        // header grows in height and items wrap instead of being clipped.
        "flex min-h-14 flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-2",
        className
      )}
      {...props}
    >
      {showTrigger && <SidebarTrigger />}

      {children != null && (
        <div
          data-slot="page-header-content"
          className="flex min-w-0 items-center gap-2"
        >
          {children}
        </div>
      )}

      {actions != null && (
        <div
          data-slot="page-header-actions"
          className="ml-auto flex flex-wrap items-center justify-end gap-3"
        >
          {actions}
        </div>
      )}
    </header>
  )
}

export { PageHeader }
export type { PageHeaderProps }
