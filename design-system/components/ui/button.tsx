import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // base — rounded-lg = 8px (BSystem rounded-lg token)
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium cursor-pointer transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none" +
  // focus ring — 3px spread, uses --ring token (d4d4d4 light / 404040 dark)
  " focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring" +
  // invalid
  " aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // Filled dark (neutral-900 bg, neutral-50 text)
        // hover → primary-hover (#404040 light / #d4d4d4 dark)
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-[var(--primary-hover)] hover:text-primary-foreground",

        // Filled light (neutral-100 bg, neutral-900 text)
        // hover → secondary-hover (#fafafa light / #171717 dark)
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-[var(--secondary-hover)]",

        // Bordered transparent
        // hover → outline-hover (#00000008 light / #ffffff19 dark)
        // dark → slight tint base via outline (#ffffff0c)
        outline:
          "border border-border bg-transparent text-foreground shadow-xs" +
          " hover:bg-[var(--outline-hover)]" +
          " dark:bg-[var(--outline)] dark:hover:bg-[var(--outline-hover)]",

        // No border, no bg — softer foreground (#404040 light / #e5e5e5 dark)
        // hover → subtle tint: #0000000c light / #ffffff19 dark
        ghost:
          "bg-transparent text-[var(--ghost-foreground)]" +
          " hover:bg-[var(--ghost-hover)]",

        // Red — uses --destructive (#dc2626 light / #991b1b dark) directly
        // No dark:bg-destructive/60 → token already handles dark value
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs" +
          " hover:bg-destructive/90" +
          " focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",

        // Blue — uses --info (#2563eb light / blue-800 dark) for informational actions
        info:
          "bg-info text-info-foreground shadow-xs" +
          " hover:bg-info/90" +
          " focus-visible:ring-[var(--info)]/20 dark:focus-visible:ring-[var(--info)]/40",

        // Amber — uses --warning (#f59e0b light / amber-800 dark) for cautionary actions
        warning:
          "bg-warning text-warning-foreground shadow-xs" +
          " hover:bg-warning/90" +
          " focus-visible:ring-[var(--warning)]/20 dark:focus-visible:ring-[var(--warning)]/40",

        // Green — uses --success (#16a34a light / green-800 dark) for confirmation actions
        success:
          "bg-success text-success-foreground shadow-xs" +
          " hover:bg-success/90" +
          " focus-visible:ring-[var(--success)]/20 dark:focus-visible:ring-[var(--success)]/40",
      },

      size: {
        // Default  36px h, 16px px (md), 8px py (xs)
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        // Large    40px h, 24px px (xl)
        lg:      "h-10 px-6 has-[>svg]:px-4",
        // Small    32px h, 12px px (sm)
        sm:      "h-8 px-3 gap-1.5 has-[>svg]:px-2.5",
        // Mini     24px h, 8px px (xs)
        xs:      "h-6 px-2 gap-1 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        // Icon sizes
        icon:    "size-9",
        "icon-lg": "size-10",
        "icon-sm": "size-8",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
