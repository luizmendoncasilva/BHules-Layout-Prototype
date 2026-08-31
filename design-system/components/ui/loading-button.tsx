"use client"

import * as React from "react"
import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface LoadingButtonProps extends React.ComponentProps<typeof Button> {
  /** When true, shows a spinner and disables the button */
  loading?: boolean
  /** Text shown while loading (defaults to children) */
  loadingText?: string
}

/**
 * LoadingButton
 *
 * A Button with an integrated loading state.
 * When `loading` is true, the button is disabled and a spinner replaces the leading icon.
 */
function LoadingButton({
  loading = false,
  loadingText,
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      data-slot="loading-button"
      disabled={loading || disabled}
      className={cn(className)}
      {...props}
    >
      {loading && (
        <Loader2Icon
          className="animate-spin"
          aria-hidden="true"
        />
      )}
      {loading && loadingText ? loadingText : children}
    </Button>
  )
}

export { LoadingButton }
export type { LoadingButtonProps }
