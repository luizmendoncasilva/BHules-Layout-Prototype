import * as React from "react"
import { Loader2Icon } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const spinnerVariants = cva(
  // base — inherits color from parent so it works inside buttons, cards, etc.
  "animate-spin text-current shrink-0",
  {
    variants: {
      size: {
        xs:      "size-3",   /* 12px — mini/xs buttons       */
        sm:      "size-3.5", /* 14px — small buttons         */
        default: "size-4",   /* 16px — default buttons       */
        lg:      "size-5",   /* 20px — large buttons         */
        xl:      "size-6",   /* 24px — standalone / overlays */
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

function Spinner({
  className,
  size,
  ...props
}: React.ComponentProps<"svg"> & VariantProps<typeof spinnerVariants>) {
  return (
    <Loader2Icon
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn(spinnerVariants({ size }), className)}
      {...props}
    />
  )
}

export { Spinner, spinnerVariants }
