"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { format, type Locale } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import {
  type FixedPortalPanelOptions,
  useFixedPortalPanel,
} from "@/lib/use-fixed-portal-panel"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"

type DatePickerPortalProps = FixedPortalPanelOptions

const panelClassName =
  "w-auto rounded-md border bg-background p-0 text-foreground shadow-lg outline-hidden"

function DatePickerPanel({
  open,
  coords,
  panelRef,
  panelId,
  zIndex,
  className,
  children,
  portalContainer,
}: Readonly<{
  open: boolean
  coords: { top: number; left: number } | null
  panelRef: React.RefObject<HTMLDialogElement | null>
  panelId: string
  zIndex: number
  className?: string
  children: React.ReactNode
  portalContainer: HTMLElement
}>) {
  if (!open || !coords) return null

  return createPortal(
    <dialog
      ref={panelRef}
      id={panelId}
      open
      data-slot="date-picker-content"
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
      className={cn(panelClassName, className)}
    >
      {children}
    </dialog>,
    portalContainer
  )
}

/**
 * Resolves the month bounds for the calendar. When the header uses dropdowns
 * (the default), a sensible range is required so the year dropdown knows which
 * years to list — we default it to `today − 100y … today + 10y` unless the
 * consumer provides explicit bounds. In `"label"` mode bounds stay untouched.
 */
function useResolvedMonthBounds(
  captionLayout: React.ComponentProps<typeof Calendar>["captionLayout"],
  startMonth: Date | undefined,
  endMonth: Date | undefined
): { startMonth: Date | undefined; endMonth: Date | undefined } {
  return React.useMemo(() => {
    if (captionLayout === "label") {
      return { startMonth, endMonth }
    }
    const currentYear = new Date().getFullYear()
    return {
      startMonth: startMonth ?? new Date(currentYear - 100, 0, 1),
      endMonth: endMonth ?? new Date(currentYear + 10, 11, 31),
    }
  }, [captionLayout, startMonth, endMonth])
}

/** Formats a date with date-fns under the given locale. */
function formatDate(date: Date, dateFormat: string, locale: Locale): string {
  return format(date, dateFormat, { locale })
}

/**
 * Coerces a cleared selection (`undefined`) to `null`. Emitting `null` instead
 * of `undefined` keeps react-hook-form `Controller`s from falling back to their
 * `defaultValue` when the field is cleared. Shared by both pickers so the
 * single picker's select/clear tests exercise both branches.
 */
function orNull<T>(value: T | undefined): T | null {
  return value ?? null
}

// ─── Single Date Picker ───────────────────────────────────────────────────────

interface DatePickerProps extends DatePickerPortalProps {
  value?: Date | null
  /**
   * Called with the selected date, or `null` when the date is cleared
   * (deselected). We emit `null` rather than `undefined` so react-hook-form
   * `Controller`s don't fall back to their `defaultValue` on clear.
   */
  onValueChange?: (date: Date | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  /** Format string for date-fns (default: "PPP") */
  dateFormat?: string
  /**
   * Calendar header layout. Defaults to `"dropdown"`, which exposes month and
   * year dropdowns in the header so users can jump to distant months/years in
   * a few clicks (great for memorable dates like birthdate). Use `"label"` for
   * a static month/year caption with arrow-only navigation.
   */
  captionLayout?: React.ComponentProps<typeof Calendar>["captionLayout"]
  /** Earliest navigable/selectable month. Defaults to today − 100 years when the header uses dropdowns. */
  startMonth?: Date
  /** Latest navigable/selectable month. Defaults to today + 10 years when the header uses dropdowns. */
  endMonth?: Date
  /**
   * Dates to disable, as a react-day-picker Matcher — e.g.
   * `{ after: new Date() }` to forbid future dates on a birthdate field.
   */
  disabledDates?: React.ComponentProps<typeof Calendar>["disabled"]
  /**
   * date-fns locale for the trigger label and the month dropdown. Defaults to
   * `ptBR` (Brazilian Portuguese). Pass another date-fns locale to override.
   */
  locale?: Locale
}

function DatePicker({
  value,
  onValueChange,
  placeholder = "Selecione uma data",
  disabled = false,
  className,
  dateFormat = "PPP",
  captionLayout = "dropdown",
  startMonth,
  endMonth,
  disabledDates,
  locale = ptBR,
  portalContainer,
  zIndex,
}: Readonly<DatePickerProps>) {
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

  const bounds = useResolvedMonthBounds(captionLayout, startMonth, endMonth)

  return (
    <div ref={anchorRef} className="inline-block">
      <Button
        type="button"
        data-slot="date-picker-trigger"
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
        {value ? formatDate(value, dateFormat, locale) : placeholder}
      </Button>
      <DatePickerPanel
        open={open}
        coords={coords}
        panelRef={panelRef}
        panelId={panelId}
        zIndex={resolvedZIndex}
        portalContainer={getPortalContainer()}
      >
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={(date) => {
            onValueChange?.(orNull(date))
            closePanel()
          }}
          captionLayout={captionLayout}
          startMonth={bounds.startMonth}
          endMonth={bounds.endMonth}
          disabled={disabledDates}
          locale={locale}
          autoFocus
        />
      </DatePickerPanel>
    </div>
  )
}

// ─── Date Range Picker ────────────────────────────────────────────────────────

interface DateRangePickerProps extends DatePickerPortalProps {
  value?: DateRange | null
  /**
   * Called with the selected range, or `null` when the range is cleared. We
   * emit `null` rather than `undefined` so react-hook-form `Controller`s don't
   * fall back to their `defaultValue` on clear.
   */
  onValueChange?: (range: DateRange | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  dateFormat?: string
  /**
   * Calendar header layout. Defaults to `"dropdown"` (month/year dropdowns).
   * Use `"label"` for a static caption with arrow-only navigation.
   */
  captionLayout?: React.ComponentProps<typeof Calendar>["captionLayout"]
  /** Earliest navigable/selectable month. Defaults to today − 100 years when the header uses dropdowns. */
  startMonth?: Date
  /** Latest navigable/selectable month. Defaults to today + 10 years when the header uses dropdowns. */
  endMonth?: Date
  /**
   * Dates to disable, as a react-day-picker Matcher — e.g. `{ after: new Date() }`.
   */
  disabledDates?: React.ComponentProps<typeof Calendar>["disabled"]
  /**
   * date-fns locale for the trigger label and the month dropdown. Defaults to
   * `ptBR` (Brazilian Portuguese). Pass another date-fns locale to override.
   */
  locale?: Locale
}

function DateRangePicker({
  value,
  onValueChange,
  placeholder = "Selecione um período",
  disabled = false,
  className,
  dateFormat = "LLL dd, y",
  captionLayout = "dropdown",
  startMonth,
  endMonth,
  disabledDates,
  locale = ptBR,
  portalContainer,
  zIndex,
}: Readonly<DateRangePickerProps>) {
  const {
    open,
    coords,
    anchorRef,
    panelRef,
    panelId,
    zIndex: resolvedZIndex,
    togglePanel,
    getPortalContainer,
  } = useFixedPortalPanel<HTMLDialogElement>({ portalContainer, zIndex })

  const bounds = useResolvedMonthBounds(captionLayout, startMonth, endMonth)

  return (
    <div ref={anchorRef} className="inline-block">
      <Button
        type="button"
        data-slot="date-range-picker-trigger"
        variant="outline"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        data-state={open ? "open" : "closed"}
        onClick={togglePanel}
        className={cn(
          "w-[300px] justify-start text-left font-normal",
          !value && "text-muted-foreground",
          className
        )}
      >
        <CalendarIcon />
        {value?.from ? (
          value.to ? (
            <>
              {formatDate(value.from, dateFormat, locale)} –{" "}
              {formatDate(value.to, dateFormat, locale)}
            </>
          ) : (
            formatDate(value.from, dateFormat, locale)
          )
        ) : (
          placeholder
        )}
      </Button>
      <DatePickerPanel
        open={open}
        coords={coords}
        panelRef={panelRef}
        panelId={panelId}
        zIndex={resolvedZIndex}
        portalContainer={getPortalContainer()}
      >
        <Calendar
          mode="range"
          selected={value ?? undefined}
          onSelect={(range) => onValueChange?.(orNull(range))}
          numberOfMonths={2}
          captionLayout={captionLayout}
          startMonth={bounds.startMonth}
          endMonth={bounds.endMonth}
          disabled={disabledDates}
          locale={locale}
          autoFocus
        />
      </DatePickerPanel>
    </div>
  )
}

export { DatePicker, DateRangePicker }
export type { DatePickerProps, DateRangePickerProps }
