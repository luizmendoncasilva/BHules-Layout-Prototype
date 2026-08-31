import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * ButtonGroup
 *
 * Wraps multiple Button components into a visually connected row.
 * - First child: only left corners rounded
 * - Middle children: no rounding
 * - Last child: only right corners rounded
 * - Adjacent borders are collapsed (border-r-0 on all except last)
 */
function ButtonGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="button-group"
      role="group"
      className={cn(
        "inline-flex items-center",
        // Remove right corners from all but last
        "[&>*:not(:last-child)]:rounded-r-none",
        // Remove left corners from all but first
        "[&>*:not(:first-child)]:rounded-l-none",
        // Collapse adjacent borders
        "[&>*:not(:last-child)]:border-r-0",
        className
      )}
      {...props}
    />
  )
}

export { ButtonGroup }
