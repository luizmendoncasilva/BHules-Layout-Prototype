import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const linkButtonVariants = cva(
  // base — shared layout, focus and disabled states
  "inline-flex items-center gap-1 cursor-pointer text-sm font-medium" +
  " underline underline-offset-4 transition-colors" +
  " focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm" +
  " disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Primary tone — uses --primary token (matches button default)
        default: "text-primary hover:text-[var(--primary-hover)]",

        // Neutral tone — softer, for inline links inside body copy
        secondary:
          "text-muted-foreground hover:text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface LinkButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof linkButtonVariants> {}

/**
 * LinkButton
 *
 * A button that renders as inline text with an underline,
 * visually matching a hyperlink while remaining a <button> element.
 * Use `variant="secondary"` for a neutral tone that blends into body copy.
 */
function LinkButton({ className, variant = "default", ...props }: LinkButtonProps) {
  return (
    <button
      data-slot="link-button"
      data-variant={variant}
      type="button"
      className={cn(linkButtonVariants({ variant, className }))}
      {...props}
    />
  )
}

export { LinkButton, linkButtonVariants }
export type { LinkButtonProps }
