import * as React from "react"
import { InboxIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface EmptyProps extends React.ComponentProps<"div"> {
  /**
   * Icon element rendered in the icon container.
   * Defaults to InboxIcon. Pass `null` to hide the icon container entirely.
   */
  icon?: React.ReactNode | null
  /** Primary heading */
  title?: string
  /** Supporting description */
  description?: string
  /** CTA button or any action element */
  action?: React.ReactNode
}

/**
 * Empty
 *
 * Empty state component for zero-data screens.
 * — Icon container: 48×48, bg-muted, rounded-xl, muted-foreground
 * — Title: text-sm/medium
 * — Description: text-sm, muted-foreground
 * — Optional action slot (typically a Button)
 */
function Empty({
  className,
  icon,
  title = "No results found",
  description,
  action,
  ...props
}: EmptyProps) {
  return (
    <div
      data-slot="empty"
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-12 text-center",
        className
      )}
      {...props}
    >
      {icon !== null && (
        <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-xl [&_svg:not([class*='size-'])]:size-6">
          {icon !== undefined ? icon : <InboxIcon />}
        </div>
      )}

      <div className="flex flex-col gap-1.5 max-w-xs">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}

export { Empty }
export type { EmptyProps }
