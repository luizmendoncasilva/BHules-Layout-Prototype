"use client"

import type * as React from "react"

import {
  ChevronsUpDownIcon,
  LogOutIcon,
  SettingsIcon,
  ShieldQuestionIcon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

type NavUserUser = {
  name: string
  email: string
  avatar?: string
  /** Perfil/escopo exibido como badge abaixo do nome. Omitido → sem badge. */
  scope?: string
}

type NavUserAction = {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick?: () => void
}

type NavUserProps = {
  user: NavUserUser
  /**
   * Itens do menu do usuário (acima do "Sair"). Quando omitido, usa os itens
   * padrão (Configurações / Solicitar troca de permissão). `[]` → nenhum.
   */
  actions?: NavUserAction[]
  /** Ação do item "Sair". */
  onLogout?: () => void
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function NavUser({ user, actions, onLogout }: NavUserProps) {
  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="group/user h-14 hover:translate-x-0 focus-visible:ring-0 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              tooltip={user.name}
            >
              <div className="relative shrink-0">
                <Avatar className="size-10 group-data-[collapsible=icon]:size-8">
                  {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                {/* Status indicator */}
                <span className="absolute bottom-0 right-0 block size-2.5 rounded-full border-2 border-sidebar bg-sidebar-success" />
              </div>
              <div className="grid flex-1 text-left leading-tight min-w-0 gap-1">
                <span className="truncate text-sm font-semibold text-sidebar-accent-foreground" title={user.name}>
                  {user.name}
                </span>
                {user.scope ? (
                  <Badge
                    variant="secondary"
                    className="w-fit px-2 py-0 text-xs bg-sidebar-accent text-sidebar-muted border-sidebar-border"
                  >
                    {user.scope}
                  </Badge>
                ) : (
                  <span className="truncate text-xs text-sidebar-muted" title={user.email}>
                    {user.email}
                  </span>
                )}
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4 text-sidebar-muted" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            {actions === undefined ? (
              <DropdownMenuGroup>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <SettingsIcon className="size-4" />
                  Configurações do usuário
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <ShieldQuestionIcon className="size-4" />
                  Solicitar troca de permissão
                </DropdownMenuItem>
              </DropdownMenuGroup>
            ) : actions.length > 0 ? (
              <DropdownMenuGroup>
                {actions.map(({ label, icon: ActionIcon, onClick }) => (
                  <DropdownMenuItem key={label} className="gap-2 cursor-pointer" onClick={onClick}>
                    {ActionIcon && <ActionIcon className="size-4" />}
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            ) : null}
            {actions?.length !== 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={onLogout}>
              <LogOutIcon className="size-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export { NavUser }
export type { NavUserUser, NavUserProps, NavUserAction }
