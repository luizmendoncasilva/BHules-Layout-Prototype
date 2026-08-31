import * as React from "react"
import { ChevronRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * ItemBadge
 *
 * 32×32 icon container with secondary background and border.
 * Place an icon (16–18px) as a child.
 */
function ItemBadge({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-badge"
      className={cn(
        "bg-secondary border border-border flex size-8 shrink-0 items-center justify-center rounded-sm [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

interface ItemProps extends React.ComponentProps<"div"> {
  /** Icon rendered inside the ItemBadge on the left */
  icon?: React.ReactNode
  /** Primary text */
  title: string
  /** Secondary text below the title */
  description?: string
  /**
   * Custom right-side action. Pass `null` to hide the chevron even when
   * onClick is set. Defaults to a ChevronRight when onClick is provided.
   */
  action?: React.ReactNode | null
  onClick?: React.MouseEventHandler<HTMLDivElement>
}

/**
 * Item
 *
 * A bordered list item with an optional icon badge, title, description,
 * and a right-side action. Based on the BSystem Figma spec:
 * — border + p-4 + gap-4 + rounded-lg
 * — icon badge: 32×32, bg-secondary, border, rounded-sm
 * — title: text-sm/medium, foreground
 * — description: text-xs/regular, muted-foreground
 * — action: chevron-right by default when clickable
 */
function Item({
  className,
  icon,
  title,
  description,
  action,
  onClick,
  ...props
}: ItemProps) {
  const isClickable = Boolean(onClick)

  return (
    <div
      data-slot="item"
      onClick={onClick}
      className={cn(
        "border border-border flex items-center gap-4 rounded-lg p-4",
        isClickable &&
          "cursor-pointer hover:bg-muted/50 transition-colors select-none",
        className
      )}
      {...props}
    >
      {icon !== undefined && <ItemBadge>{icon}</ItemBadge>}

      <div
        data-slot="item-content"
        className="flex min-w-0 flex-1 flex-col gap-1"
      >
        <p className="truncate text-sm font-medium leading-5 text-foreground">
          {title}
        </p>
        {description && (
          <p className="truncate text-xs leading-4 text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {action !== null &&
        (action !== undefined ? (
          action
        ) : isClickable ? (
          <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
        ) : null)}
    </div>
  )
}

export { Item, ItemBadge }
export type { ItemProps }
