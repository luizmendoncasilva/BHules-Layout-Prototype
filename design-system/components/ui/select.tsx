"use client"

import * as React from "react"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { Select as SelectPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

type SelectDeselectContextValue = {
  isDeselectable: boolean
  value: string | undefined
  requestDeselect: () => void
}

const SelectDeselectContext = React.createContext<SelectDeselectContextValue>({
  isDeselectable: false,
  value: undefined,
  requestDeselect: () => {
    /* no-op: the real implementation is provided by <Select> */
  },
})

function Select({
  isDeselectable = true,
  value,
  defaultValue,
  onValueChange,
  open,
  defaultOpen,
  onOpenChange,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root> & {
  isDeselectable?: boolean
}) {
  // We own value + open as controllable state so that re-selecting the active
  // item can clear the selection (see SelectItem). State is always initialized
  // to a concrete value so Radix stays consistently controlled and never warns
  // about switching between controlled/uncontrolled.
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "")
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen ?? false)

  const currentValue = value ?? internalValue
  const currentOpen = open ?? internalOpen

  const handleValueChange = React.useCallback(
    (next: string) => {
      if (value === undefined) setInternalValue(next)
      onValueChange?.(next)
    },
    [value, onValueChange]
  )

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (open === undefined) setInternalOpen(next)
      onOpenChange?.(next)
    },
    [open, onOpenChange]
  )

  // Clearing uses "" (Radix's sentinel for "no selection" → shows placeholder),
  // never undefined, to avoid flipping controlled consumers to uncontrolled.
  const requestDeselect = React.useCallback(() => {
    handleValueChange("")
    handleOpenChange(false)
  }, [handleValueChange, handleOpenChange])

  const contextValue = React.useMemo<SelectDeselectContextValue>(
    () => ({ isDeselectable, value: currentValue, requestDeselect }),
    [isDeselectable, currentValue, requestDeselect]
  )

  return (
    <SelectDeselectContext.Provider value={contextValue}>
      <SelectPrimitive.Root
        data-slot="select"
        value={currentValue}
        open={currentOpen}
        onValueChange={handleValueChange}
        onOpenChange={handleOpenChange}
        {...props}
      >
        {children}
      </SelectPrimitive.Root>
    </SelectDeselectContext.Provider>
  )
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring aria-invalid:ring-destructive/20 aria-invalid:border-destructive flex w-fit items-center justify-between gap-2 rounded-lg border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = "item-aligned",
  align = "center",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-lg border shadow-md",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  const {
    isDeselectable,
    value: selectedValue,
    requestDeselect,
  } = React.useContext(SelectDeselectContext)
  const pointerTypeRef = React.useRef("")

  // Toggle behavior: clicking the already-selected item clears the selection.
  // Radix never fires onValueChange for an unchanged value, so we intercept the
  // activation event, cancel Radix's own selection with preventDefault (which
  // composeEventHandlers honors), and drive the clear + close ourselves. The
  // pointerType gate mirrors Radix so we fire exactly once per activation.
  const isSelected =
    isDeselectable && props.value !== "" && selectedValue === props.value

  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-pointer items-center gap-2 rounded-md py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      {...props}
      onPointerDown={(event) => {
        pointerTypeRef.current = event.pointerType
        props.onPointerDown?.(event)
      }}
      onPointerUp={(event) => {
        props.onPointerUp?.(event)
        if (isSelected && pointerTypeRef.current === "mouse") {
          event.preventDefault()
          requestDeselect()
        }
      }}
      onClick={(event) => {
        props.onClick?.(event)
        if (isSelected && pointerTypeRef.current !== "mouse") {
          event.preventDefault()
          requestDeselect()
        }
      }}
      onKeyDown={(event) => {
        props.onKeyDown?.(event)
        if (isSelected && event.key === "Enter") {
          event.preventDefault()
          requestDeselect()
        }
      }}
    >
      <span
        data-slot="select-item-indicator"
        className="absolute right-2 flex size-3.5 items-center justify-center"
      >
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
