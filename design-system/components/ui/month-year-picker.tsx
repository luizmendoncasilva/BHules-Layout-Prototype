"use client"

/* v8 ignore start */
import * as React from "react"
import { createPortal } from "react-dom"
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { useFixedPortalPanel } from "@/lib/use-fixed-portal-panel"
import type { FixedPortalPanelOptions } from "@/lib/use-fixed-portal-panel"
import { Button } from "@/components/ui/button"
/* v8 ignore stop */

interface MonthYearPickerProps extends FixedPortalPanelOptions {
  value?: Date
  defaultValue?: Date
  onValueChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  /** Earliest selectable month (inclusive). Day-of-month is ignored. */
  min?: Date
  /** Latest selectable month (inclusive). Day-of-month is ignored. */
  max?: Date
  /** BCP 47 locale tag for month names. Default: "pt-BR". */
  locale?: string
}

const MONTHS_IN_YEAR = 12
const GRID_COLS = 4

const panelClassName =
  "w-[280px] rounded-md border bg-background p-3 text-foreground shadow-lg outline-hidden"

function MonthYearPickerPanel({
  open,
  coords,
  panelRef,
  panelId,
  zIndex,
  children,
  portalContainer,
}: Readonly<{
  open: boolean
  coords: { top: number; left: number } | null
  panelRef: React.RefObject<HTMLDialogElement | null>
  panelId: string
  zIndex: number
  children: React.ReactNode
  portalContainer: HTMLElement
}>) {
  if (!open || !coords) return null

  return createPortal(
    <dialog
      ref={panelRef}
      id={panelId}
      open
      data-slot="month-year-picker-content"
      data-state="open"
      style={{
        position: "fixed",
        top: coords.top,
        left: coords.left,
        right: "auto",
        bottom: "auto",
        margin: 0,
        zIndex,
        visibility: "visible",
        opacity: 1,
        pointerEvents: "auto",
        isolation: "isolate",
      }}
      className={panelClassName}
    >
      {children}
    </dialog>,
    portalContainer
  )
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatMonthLabel(
  formatter: Intl.DateTimeFormat,
  monthIndex: number
): string {
  const date = new Date(2000, monthIndex, 1)
  return capitalize(formatter.format(date).replace(/\.$/, ""))
}

function MonthYearPicker({
  value: controlledValue,
  defaultValue,
  onValueChange,
  placeholder = "Selecione mês e ano",
  disabled = false,
  className,
  min,
  max,
  locale = "pt-BR",
  portalContainer,
  zIndex,
}: Readonly<MonthYearPickerProps>) {
  const isControlled = controlledValue !== undefined
  const [uncontrolledValue, setUncontrolledValue] = React.useState<
    Date | undefined
  >(defaultValue)
  const value = isControlled ? controlledValue : uncontrolledValue

  const {
    open,
    coords,
    anchorRef,
    panelRef,
    panelId,
    zIndex: resolvedZIndex,
    closePanel,
    togglePanel,
    getPortalContainer,
  } = useFixedPortalPanel<HTMLDialogElement>({ portalContainer, zIndex })

  const initialReference = value ?? defaultValue ?? new Date()
  const [viewYear, setViewYear] = React.useState<number>(
    initialReference.getFullYear()
  )
  const [activeIndex, setActiveIndex] = React.useState<number>(
    initialReference.getMonth()
  )

  // Re-sync the panel view with the selected value when reopening.
  React.useEffect(() => {
    if (!open || !value) return
    setViewYear(value.getFullYear())
    setActiveIndex(value.getMonth())
  }, [open, value])

  const shortFormatter = React.useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "short" }),
    [locale]
  )
  const triggerFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }),
    [locale]
  )

  const monthLabels = React.useMemo(
    () =>
      Array.from({ length: MONTHS_IN_YEAR }, (_, i) =>
        formatMonthLabel(shortFormatter, i)
      ),
    [shortFormatter]
  )

  const triggerLabel = React.useMemo(() => {
    if (!value) return null
    return capitalize(triggerFormatter.format(value))
  }, [value, triggerFormatter])

  const minMonth = React.useMemo(() => (min ? startOfMonth(min) : null), [min])
  const maxMonth = React.useMemo(() => (max ? startOfMonth(max) : null), [max])

  const isMonthDisabled = React.useCallback(
    (monthIndex: number) => {
      const candidate = new Date(viewYear, monthIndex, 1)
      if (minMonth && candidate < minMonth) return true
      if (maxMonth && candidate > maxMonth) return true
      return false
    },
    [viewYear, minMonth, maxMonth]
  )

  const canPrevYear = !minMonth || viewYear - 1 >= minMonth.getFullYear()
  const canNextYear = !maxMonth || viewYear + 1 <= maxMonth.getFullYear()

  // Year dropdown range: bounded by [min, max] when provided, otherwise a
  // sensible default of today − 100y … today + 10y. Always widened to include
  // the year currently in view so the <select> can show it.
  const yearOptions = React.useMemo(() => {
    const currentYear = new Date().getFullYear()
    const start = minMonth ? minMonth.getFullYear() : currentYear - 100
    const end = maxMonth ? maxMonth.getFullYear() : currentYear + 10
    const lo = Math.min(start, viewYear)
    const hi = Math.max(end, viewYear)
    return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)
  }, [minMonth, maxMonth, viewYear])

  const handleYearSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setViewYear(Number(event.target.value))
  }

  const isSelectedMonth = (monthIndex: number) =>
    value !== undefined &&
    value.getFullYear() === viewYear &&
    value.getMonth() === monthIndex

  const handleSelect = (monthIndex: number) => {
    const next = new Date(viewYear, monthIndex, 1)
    if (!isControlled) setUncontrolledValue(next)
    onValueChange?.(next)
    closePanel()
  }

  // Roving focus: when the panel opens or the active cell changes, focus it.
  React.useEffect(() => {
    if (!open || !panelRef.current) return
    panelRef.current
      .querySelector<HTMLButtonElement>(`[data-month="${activeIndex}"]`)
      ?.focus()
  }, [open, activeIndex, panelRef])

  const moveActive = (event: React.KeyboardEvent, nextIndex: number) => {
    event.preventDefault()
    setActiveIndex(nextIndex)
  }

  const handleGridKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowLeft":
        moveActive(event, Math.max(0, activeIndex - 1))
        return
      case "ArrowRight":
        moveActive(event, Math.min(MONTHS_IN_YEAR - 1, activeIndex + 1))
        return
      case "ArrowUp":
        moveActive(event, Math.max(0, activeIndex - GRID_COLS))
        return
      case "ArrowDown":
        moveActive(event, Math.min(MONTHS_IN_YEAR - 1, activeIndex + GRID_COLS))
        return
      case "Home":
        moveActive(event, 0)
        return
      case "End":
        moveActive(event, MONTHS_IN_YEAR - 1)
        return
      case "PageUp":
        event.preventDefault()
        if (canPrevYear) setViewYear((y) => y - 1)
        return
      case "PageDown":
        event.preventDefault()
        if (canNextYear) setViewYear((y) => y + 1)
        return
    }
  }

  return (
    <div ref={anchorRef} className="inline-block">
      <Button
        type="button"
        data-slot="month-year-picker-trigger"
        variant="outline"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        data-state={open ? "open" : "closed"}
        onClick={togglePanel}
        className={cn(
          "w-[240px] justify-start text-left font-normal",
          !value && "text-muted-foreground",
          className
        )}
      >
        <CalendarIcon />
        {triggerLabel ?? placeholder}
      </Button>
      <MonthYearPickerPanel
        open={open}
        coords={coords}
        panelRef={panelRef}
        panelId={panelId}
        zIndex={resolvedZIndex}
        portalContainer={getPortalContainer()}
      >
        <div className="mb-3 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Ano anterior"
            disabled={!canPrevYear}
            onClick={() => setViewYear((y) => y - 1)}
          >
            <ChevronLeftIcon />
          </Button>
          <div className="flex items-center">
            <select
              data-slot="month-year-picker-year-select"
              aria-label="Selecionar ano"
              value={viewYear}
              onChange={handleYearSelect}
              className={cn(
                "h-8 cursor-pointer rounded-lg border border-input bg-transparent px-2 text-sm font-medium shadow-xs outline-none",
                "focus-visible:border-ring focus-visible:ring-ring focus-visible:ring-[3px]"
              )}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            {/* Keeps the year announced to screen readers (and the existing
                data-slot) regardless of whether it changed via select or arrows. */}
            <span
              data-slot="month-year-picker-year"
              className="sr-only"
              aria-live="polite"
            >
              {viewYear}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Próximo ano"
            disabled={!canNextYear}
            onClick={() => setViewYear((y) => y + 1)}
          >
            <ChevronRightIcon />
          </Button>
        </div>
        <div
          role="grid"
          aria-label="Selecionar mês"
          tabIndex={-1}
          className="grid grid-cols-4 gap-2 focus:outline-none"
          onKeyDown={handleGridKeyDown}
        >
          {monthLabels.map((label, i) => {
            const selected = isSelectedMonth(i)
            const monthDisabled = isMonthDisabled(i)
            return (
              <Button
                key={label}
                type="button"
                role="gridcell"
                aria-selected={selected}
                data-month={i}
                data-selected={selected}
                disabled={monthDisabled}
                variant={selected ? "default" : "ghost"}
                size="sm"
                tabIndex={i === activeIndex ? 0 : -1}
                onClick={() => handleSelect(i)}
                className={cn(
                  "h-9 px-0 text-sm font-normal",
                  selected && "font-medium"
                )}
              >
                {label}
              </Button>
            )
          })}
        </div>
      </MonthYearPickerPanel>
    </div>
  )
}

export { MonthYearPicker }
export type { MonthYearPickerProps }
