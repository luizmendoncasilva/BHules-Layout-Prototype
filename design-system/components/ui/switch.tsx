"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        // base
        "peer group/switch inline-flex shrink-0 items-center rounded-full border border-transparent shadow-xs transition-colors outline-none",
        // checked → --primary (#171717 light / #f5f5f5 dark)
        "data-[state=checked]:bg-primary",
        // unchecked → --input (#e5e5e5 light / #404040 dark)
        "data-[state=unchecked]:bg-input",
        // focus ring — 3px, uses --ring token
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring",
        // cursor & disabled
        "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        // sizes
        "data-[size=default]:h-[1.15rem] data-[size=default]:w-8",
        "data-[size=sm]:h-3.5 data-[size=sm]:w-6",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          // base thumb
          "pointer-events-none block rounded-full ring-0 transition-transform",
          // light: always white bg
          "bg-background",
          // dark unchecked: white thumb on dark (#404040) track
          "dark:data-[state=unchecked]:bg-foreground",
          // dark checked: dark thumb on light (#f5f5f5) track
          "dark:data-[state=checked]:bg-primary-foreground",
          // translate — calc(thumb-width - 2px) for each size
          "data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0",
          // thumb sizes
          "group-data-[size=default]/switch:size-4",
          "group-data-[size=sm]/switch:size-3"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
