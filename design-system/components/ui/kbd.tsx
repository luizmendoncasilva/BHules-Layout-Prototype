import * as React from "react"

import { cn } from "@/lib/utils"

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        // shape & size — h-5 (20px), min-w-5, rounded-md (4px = --rounded-xs-sm area)
        "pointer-events-none inline-flex h-5 w-fit min-w-5 select-none items-center justify-center gap-1 rounded-md px-1.5",
        // typography — text-xs (12px) font-medium (500), Inter via font-sans
        "font-sans text-xs font-medium",
        // colors — muted bg + muted-foreground text + visible border
        "bg-muted text-muted-foreground border border-border",
        // shadow for key depth
        "shadow-2xs",
        // inside tooltip (dark bg → light tint + background-colored text)
        "[[data-slot=tooltip-content]_&]:border-transparent",
        "[[data-slot=tooltip-content]_&]:bg-primary-foreground/20",
        "[[data-slot=tooltip-content]_&]:text-primary-foreground",
        // svg inside
        "[&_svg:not([class*='size-'])]:size-3",
        className
      )}
      {...props}
    />
  )
}

// Wrapper for sequences like ⌘ + K — uses <span> (not <kbd>) for valid HTML
function KbdGroup({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  )
}

export { Kbd, KbdGroup }
