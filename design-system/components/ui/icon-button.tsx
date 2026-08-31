"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type IconButtonSize = "xs" | "sm" | "default" | "lg"

const sizeMap = {
  xs: "icon-xs",
  sm: "icon-sm",
  default: "icon",
  lg: "icon-lg",
} as const

interface IconButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "size"> {
  /** Accessible label — required for icon-only buttons */
  "aria-label": string
  size?: IconButtonSize
}

/**
 * IconButton
 *
 * A square button that contains only an icon.
 * Enforces `aria-label` for accessibility.
 * Maps `size` to the icon-specific size variants of Button.
 */
function IconButton({ size = "default", className, ...props }: IconButtonProps) {
  return (
    <Button
      data-slot="icon-button"
      size={sizeMap[size]}
      className={cn(className)}
      {...props}
    />
  )
}

export { IconButton }
export type { IconButtonProps }
