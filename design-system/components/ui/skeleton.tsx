import * as React from "react"

import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        // bg-muted → #f5f5f5 light / #171717 dark (semantically "muted placeholder")
        "animate-pulse rounded-lg bg-muted",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
