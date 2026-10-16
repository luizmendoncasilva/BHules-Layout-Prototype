"use client"

import { SparklesIcon, XIcon, type LucideIcon } from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"

type UpdateCardProps = {
  /** Controls visibility. When `false`, the card is not rendered (feature-flag). Defaults to `true`. */
  enabled?: boolean
  /** Small uppercase eyebrow text. */
  label?: string
  title: string
  description: string
  href: string
  /** Call-to-action text for the link. */
  cta?: string
  /** Icon shown in the top-right corner. */
  icon?: LucideIcon
  /** When provided, renders a dismiss button that triggers this callback. */
  onDismiss?: () => void
}

function UpdateCard({
  enabled = true,
  label = "ATUALIZAÇÃO",
  title,
  description,
  href,
  cta = "Saiba mais",
  icon: Icon = SparklesIcon,
  onDismiss,
}: UpdateCardProps) {
  const { state } = useSidebar()

  if (!enabled) return null
  if (state === "collapsed") return null

  return (
    <div
      data-slot="update-card"
      className="group/update-card relative mx-2 overflow-hidden rounded-xl p-px"
    >
      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-xl bg-[conic-gradient(from_var(--border-angle),transparent_60%,var(--sidebar-info)_80%,transparent_100%)] animate-[border-rotate_4s_linear_infinite]" />

      {/* Card body */}
      <div className="relative rounded-[11px] bg-gradient-to-br from-sidebar-elevated to-sidebar-accent p-4">
        {onDismiss ? (
          <button
            type="button"
            data-slot="update-card-dismiss"
            onClick={onDismiss}
            aria-label="Dispensar atualização"
            className="absolute top-3 right-3 flex size-5 cursor-pointer items-center justify-center rounded-md text-sidebar-subtle transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <XIcon className="size-3.5" />
          </button>
        ) : (
          <Icon className="absolute top-3 right-3 size-4 text-sidebar-info animate-[pulse-subtle_3s_ease-in-out_infinite]" />
        )}

        <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-muted">
          {label}
        </span>
        <p className="mt-2 text-sm font-medium text-sidebar-accent-foreground">
          {title}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-sidebar-muted">
          {description}
        </p>
        <a
          href={href}
          className="group/link relative mt-3 inline-block text-xs font-medium text-sidebar-foreground no-underline transition-colors hover:text-sidebar-accent-foreground"
        >
          {cta}
          <span className="absolute bottom-0 left-0 h-px w-0 bg-sidebar-accent-foreground transition-[width] duration-300 ease-out group-hover/link:w-full" />
        </a>
      </div>
    </div>
  )
}

export { UpdateCard }
export type { UpdateCardProps }
