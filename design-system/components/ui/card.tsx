"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type CardPadding = "none" | "sm" | "md" | "lg"

const paddingY: Record<CardPadding, string> = {
  none: "py-0",
  sm: "py-3",
  md: "py-6",
  lg: "py-8",
}

const paddingX: Record<CardPadding, string> = {
  none: "px-0",
  sm: "px-3",
  md: "px-6",
  lg: "px-8",
}

const paddingT: Record<CardPadding, string> = {
  none: "[.border-t]:pt-0",
  sm: "[.border-t]:pt-3",
  md: "[.border-t]:pt-6",
  lg: "[.border-t]:pt-8",
}

const paddingB: Record<CardPadding, string> = {
  none: "[.border-b]:pb-0",
  sm: "[.border-b]:pb-3",
  md: "[.border-b]:pb-6",
  lg: "[.border-b]:pb-8",
}

const CardPaddingContext = React.createContext<CardPadding>("md")

interface CardProps extends React.ComponentProps<"div"> {
  /** Controls vertical padding of the Card and horizontal padding of its sub-components. Defaults to `md`. */
  padding?: CardPadding
}

function Card({ className, padding = "md", ...props }: Readonly<CardProps>) {
  return (
    <CardPaddingContext.Provider value={padding}>
      <div
        data-slot="card"
        data-padding={padding}
        className={cn(
          "bg-card text-card-foreground flex flex-col gap-6 rounded-lg border shadow-sm",
          paddingY[padding],
          className
        )}
        {...props}
      />
    </CardPaddingContext.Provider>
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  const padding = React.useContext(CardPaddingContext)
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 has-data-[slot=card-action]:grid-cols-[1fr_auto]",
        paddingX[padding],
        paddingB[padding],
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  const padding = React.useContext(CardPaddingContext)
  return (
    <div
      data-slot="card-content"
      className={cn(paddingX[padding], className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  const padding = React.useContext(CardPaddingContext)
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center",
        paddingX[padding],
        paddingT[padding],
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
export type { CardProps, CardPadding }
