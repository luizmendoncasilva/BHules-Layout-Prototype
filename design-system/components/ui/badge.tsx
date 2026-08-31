import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // base
  "inline-flex items-center justify-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 [&>svg]:size-3 [&>svg]:pointer-events-none transition-colors overflow-hidden" +
  // focus
  " focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:border-ring" +
  // invalid
  " aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-transparent [a&]:hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground border-transparent [a&]:hover:bg-secondary/80",
        outline:
          "bg-transparent border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost:
          "bg-transparent border-transparent text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        destructive:
          "bg-destructive text-destructive-foreground border-transparent [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        success:
          "bg-success text-success-foreground border-transparent [a&]:hover:bg-success/90 focus-visible:ring-success/20 dark:focus-visible:ring-success/40",
        warning:
          "bg-warning text-warning-foreground border-transparent [a&]:hover:bg-warning/90 focus-visible:ring-warning/20 dark:focus-visible:ring-warning/40",
        info:
          "bg-info text-info-foreground border-transparent [a&]:hover:bg-info/90 focus-visible:ring-info/20 dark:focus-visible:ring-info/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
