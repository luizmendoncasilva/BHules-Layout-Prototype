"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type CurrentDateTimeProps = {
  className?: string
  /** Fixed date for demos/tests. When omitted, uses a live clock. */
  date?: Date
  locale?: string
}

function formatDateTime(date: Date, locale: string) {
  const datePart = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date)

  const timePart = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)

  return { datePart, timePart }
}

function CurrentDateTime({
  className,
  date: fixedDate,
  locale = "pt-BR",
}: CurrentDateTimeProps) {
  const [now, setNow] = React.useState(() => fixedDate ?? new Date())

  React.useEffect(() => {
    if (fixedDate) {
      setNow(fixedDate)
      return
    }

    setNow(new Date())
    const interval = window.setInterval(() => setNow(new Date()), 60_000)

    return () => window.clearInterval(interval)
  }, [fixedDate])

  const { datePart, timePart } = formatDateTime(now, locale)

  return (
    <time
      data-slot="current-datetime"
      dateTime={now.toISOString()}
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums",
        className
      )}
    >
      <span>{datePart}</span>
      <span aria-hidden className="text-border">
        ·
      </span>
      <span>{timePart}</span>
    </time>
  )
}

export { CurrentDateTime }
export type { CurrentDateTimeProps }
