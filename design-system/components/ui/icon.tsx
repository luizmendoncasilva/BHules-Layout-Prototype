import * as React from "react"
import { type LucideIcon } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const iconVariants = cva("shrink-0", {
  variants: {
    size: {
      sm: "size-3",   // 12px
      md: "size-4",   // 16px (default button icon size)
      xl: "size-6",   // 24px
    },
    color: {
      // Primary text — dark in light mode, light in dark mode
      black: "text-foreground",
      // Secondary/muted text — softer tone
      neutral: "text-muted-foreground",
    },
  },
  defaultVariants: {
    size: "md",
    color: "black",
  },
})

interface IconProps
  extends Omit<React.SVGProps<SVGSVGElement>, "color">,
    VariantProps<typeof iconVariants> {
  /** Lucide icon component to render. Restricts icon usage to the design system set. */
  icon: LucideIcon
}

/**
 * Icon
 *
 * Restricts icon usage to a controlled set of sizes (sm | md | xl) and colors
 * (black | neutral). Pass any Lucide icon via the `icon` prop. Always prefer
 * this component over rendering a Lucide icon directly to keep visual rhythm
 * consistent across the system.
 */
function Icon({
  icon: IconComponent,
  size = "md",
  color = "black",
  className,
  ...props
}: Readonly<IconProps>) {
  return (
    <IconComponent
      data-slot="icon"
      data-size={size}
      data-color={color}
      className={cn(iconVariants({ size, color }), className)}
      {...props}
    />
  )
}

export { Icon, iconVariants }
export type { IconProps }
