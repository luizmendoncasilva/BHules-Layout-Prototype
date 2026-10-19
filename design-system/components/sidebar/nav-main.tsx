"use client"

import * as React from "react"
import { ChevronRightIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { NavGroup, NavItem } from "@/components/sidebar/nav-config"
import { NotificationDot } from "@/components/sidebar/notification-dot"

const DISABLED_MESSAGE = "Você não tem permissão para acessar esse módulo"
const DEFAULT_NOTIFICATION_TOOLTIP = "Novos arquivos disponíveis"

function SidebarNotificationDot({
  tooltip,
}: {
  tooltip: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="absolute right-2 top-1/2 -translate-y-1/2 group-data-[collapsible=icon]:hidden">
          <NotificationDot pulse />
        </span>
      </TooltipTrigger>
      <TooltipContent side="right">{tooltip}</TooltipContent>
    </Tooltip>
  )
}

/**
 * Badge counter shown on top of the icon while the sidebar is collapsed
 * (SidebarMenuBadge itself is hidden in icon mode).
 */
function CollapsedBadge({ badge }: { badge: string | number }) {
  const display = typeof badge === "number" && badge > 99 ? "99+" : badge
  return (
    <span
      data-slot="sidebar-menu-badge-collapsed"
      className="pointer-events-none absolute -top-1 -right-1 hidden h-4 min-w-4 items-center justify-center rounded-full bg-sidebar-primary px-1 text-[10px] font-semibold tabular-nums text-sidebar-primary-foreground group-data-[collapsible=icon]:flex"
    >
      {display}
    </span>
  )
}

function hasBadge(badge: NavItem["badge"]) {
  return badge !== undefined && badge !== null && badge !== "" && badge !== 0
}

function itemKey(item: NavItem) {
  return item.id ?? item.title
}

/** True when the item or any descendant is active. */
function containsActive(item: NavItem): boolean {
  return Boolean(item.isActive) || (item.items ?? []).some(containsActive)
}

/**
 * Open state for collapsible items: starts open when the item is active and
 * re-opens automatically whenever it becomes active (e.g. navigation from
 * outside the sidebar). The user can still close it manually.
 */
function useAutoOpen(active: boolean) {
  const [open, setOpen] = React.useState(active)
  React.useEffect(() => {
    if (active) setOpen(true)
  }, [active])
  return [open, setOpen] as const
}

function DisabledButton({
  item,
  disabledTooltip,
  withChevron,
}: {
  item: NavItem
  disabledTooltip: string
  withChevron?: boolean
}) {
  const Icon = item.icon
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex w-full">
          <SidebarMenuButton
            tooltip={undefined}
            isActive={item.isActive}
            aria-disabled
            className="pointer-events-none opacity-50"
          >
            {Icon && <Icon />}
            <span>{item.title}</span>
            {withChevron && <ChevronRightIcon className="ml-auto size-4 rotate-90" />}
          </SidebarMenuButton>
        </span>
      </TooltipTrigger>
      <TooltipContent side="right">{disabledTooltip}</TooltipContent>
    </Tooltip>
  )
}

/** Leaf (or nested group) rendered inside a SidebarMenuSub. */
function SubItem({ item }: { item: NavItem }) {
  const Icon = item.icon
  const hasChildren = Boolean(item.items && item.items.length > 0)
  const active = containsActive(item)
  const [open, setOpen] = useAutoOpen(active)

  if (hasChildren) {
    return (
      <Collapsible
        asChild
        open={open}
        onOpenChange={setOpen}
        className="group/sub-collapsible"
      >
        <SidebarMenuSubItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuSubButton asChild>
              <button type="button" className="w-full cursor-pointer text-left">
                {Icon && <Icon />}
                <span className="flex-1">{item.title}</span>
                <ChevronRightIcon className="ml-auto size-3.5 text-sidebar-muted! rotate-90 transition-transform duration-200 [[data-state=open]>&]:-rotate-90" />
              </button>
            </SidebarMenuSubButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub className="mr-0 pr-0">
              {item.items!.map((child) => (
                <SubItem key={itemKey(child)} item={child} />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuSubItem>
      </Collapsible>
    )
  }

  const content = (
    <>
      {Icon && <Icon />}
      <span>{item.title}</span>
    </>
  )

  return (
    <SidebarMenuSubItem>
      {item.href && !item.onClick ? (
        <SidebarMenuSubButton
          href={item.href}
          isActive={item.isActive}
          aria-disabled={item.disabled || undefined}
        >
          {content}
        </SidebarMenuSubButton>
      ) : (
        <SidebarMenuSubButton
          asChild
          isActive={item.isActive}
          aria-disabled={item.disabled || undefined}
        >
          <button
            type="button"
            className="w-full cursor-pointer text-left"
            onClick={item.onClick}
          >
            {content}
          </button>
        </SidebarMenuSubButton>
      )}
    </SidebarMenuSubItem>
  )
}

function CollapsibleNavItem({
  item,
  disabledTooltip,
}: {
  item: NavItem
  disabledTooltip: string
}) {
  const { state, isMobile, setOpen: setSidebarOpen } = useSidebar()
  const active = containsActive(item)
  const [open, setOpen] = useAutoOpen(active)
  const Icon = item.icon
  const iconMode = state === "collapsed" && !isMobile

  return (
    <Collapsible
      asChild
      open={open}
      onOpenChange={setOpen}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        {item.disabled ? (
          <DisabledButton item={item} disabledTooltip={disabledTooltip} withChevron />
        ) : (
          <CollapsibleTrigger
            asChild
            onClick={(event) => {
              // Icon mode: the sub-list is hidden, so expand the sidebar,
              // open the group and let the consumer navigate.
              if (iconMode) {
                event.preventDefault()
                setSidebarOpen(true)
                setOpen(true)
                item.onClick?.()
              }
            }}
          >
            <SidebarMenuButton
              tooltip={item.title}
              isActive={active}
              className={hasBadge(item.badge) ? "pr-14" : undefined}
            >
              {Icon && <Icon />}
              <span>{item.title}</span>
              <ChevronRightIcon className="ml-auto size-4 rotate-90 transition-transform duration-200 [[data-state=open]>&]:-rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
        )}
        {!item.disabled && hasBadge(item.badge) && (
          <>
            <SidebarMenuBadge className="right-8">{item.badge}</SidebarMenuBadge>
            <CollapsedBadge badge={item.badge!} />
          </>
        )}
        {!item.disabled && (
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.items!.map((subItem) => (
                <SubItem key={itemKey(subItem)} item={subItem} />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        )}
      </SidebarMenuItem>
    </Collapsible>
  )
}

function renderItem(
  item: NavItem,
  disabledTooltip: string
) {
  if (item.items && item.items.length > 0) {
    return (
      <CollapsibleNavItem
        key={itemKey(item)}
        item={item}
        disabledTooltip={disabledTooltip}
      />
    )
  }

  const Icon = item.icon
  const content = (
    <>
      {Icon && <Icon />}
      <span>{item.title}</span>
    </>
  )

  return (
    <SidebarMenuItem key={itemKey(item)}>
      {item.disabled ? (
        <DisabledButton item={item} disabledTooltip={disabledTooltip} />
      ) : item.href && !item.onClick ? (
        <SidebarMenuButton asChild tooltip={item.title} isActive={item.isActive}>
          <a href={item.href}>{content}</a>
        </SidebarMenuButton>
      ) : (
        <SidebarMenuButton
          tooltip={item.title}
          isActive={item.isActive}
          onClick={item.onClick}
          className="cursor-pointer"
        >
          {content}
        </SidebarMenuButton>
      )}
      {!item.disabled && hasBadge(item.badge) && (
        <>
          <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
          <CollapsedBadge badge={item.badge!} />
        </>
      )}
      {!item.disabled && item.hasNotification && (
        <SidebarNotificationDot
          tooltip={item.notificationTooltip ?? DEFAULT_NOTIFICATION_TOOLTIP}
        />
      )}
    </SidebarMenuItem>
  )
}

type NavMainProps = {
  navGroups: NavGroup[]
  disabledTooltip?: string
}

function NavMain({ navGroups, disabledTooltip = DISABLED_MESSAGE }: NavMainProps) {
  return (
    <>
      {navGroups.map((group, groupIndex) => (
        <SidebarGroup key={group.label ?? groupIndex}>
          {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => renderItem(item, disabledTooltip))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  )
}

export { NavMain }
export type { NavMainProps }
