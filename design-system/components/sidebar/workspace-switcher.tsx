"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon, SearchIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export type Workspace = {
  id: string
  name: string
  logo?: React.ReactNode
  identifier?: string
}

type WorkspaceSwitcherProps = {
  workspaces: Workspace[]
  activeWorkspaceId: string
  onWorkspaceChange: (id: string) => void
}

const SEARCH_THRESHOLD = 5

function WorkspaceItem({
  workspace,
  isActive,
  onSelect,
}: {
  workspace: Workspace
  isActive: boolean
  onSelect: () => void
}) {
  return (
    <DropdownMenuItem
      onClick={onSelect}
      className="relative gap-2 p-2 cursor-pointer overflow-hidden before:absolute before:inset-0 before:origin-left before:scale-x-0 before:bg-accent before:transition-transform before:duration-200 before:ease-out hover:before:scale-x-100 hover:bg-transparent"
    >
      <Avatar className="relative z-10 size-8 rounded-md shrink-0">
        {typeof workspace.logo === "string" && (
          <AvatarImage src={workspace.logo} alt={workspace.name} />
        )}
        <AvatarFallback className="rounded-md text-xs font-medium">
          {workspace.name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="relative z-10 flex flex-col min-w-0">
        <span className="truncate text-sm font-medium">{workspace.name}</span>
        {workspace.identifier && (
          <span className="truncate text-xs text-muted-foreground">
            {workspace.identifier}
          </span>
        )}
      </div>
      {isActive && (
        <CheckIcon className="relative z-10 ml-auto size-4 shrink-0" />
      )}
    </DropdownMenuItem>
  )
}

function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
  onWorkspaceChange,
}: WorkspaceSwitcherProps) {
  const { isMobile } = useSidebar()
  const [search, setSearch] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId)
  const hasSearch = workspaces.length > SEARCH_THRESHOLD

  const filteredWorkspaces = React.useMemo(() => {
    if (!search) return workspaces
    const query = search.toLowerCase()
    return workspaces.filter(
      (w) =>
        w.name.toLowerCase().includes(query) ||
        w.identifier?.toLowerCase().includes(query)
    )
  }, [workspaces, search])

  React.useEffect(() => {
    if (!open) setSearch("")
  }, [open])

  if (!activeWorkspace) return null

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="h-14 hover:translate-x-0 focus-visible:ring-0 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              tooltip={activeWorkspace.name}
            >
              <Avatar className="size-10 rounded-lg shrink-0 group-data-[collapsible=icon]:size-8">
                {typeof activeWorkspace.logo === "string" && (
                  <AvatarImage src={activeWorkspace.logo} alt={activeWorkspace.name} />
                )}
                <AvatarFallback className="rounded-lg bg-sidebar-accent text-sidebar-accent-foreground text-base font-semibold group-data-[collapsible=icon]:text-sm">
                  {activeWorkspace.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight min-w-0">
                <span className="truncate text-sm font-semibold text-sidebar-accent-foreground" title={activeWorkspace.name}>
                  {activeWorkspace.name}
                </span>
                {activeWorkspace.identifier && (
                  <span className="truncate text-xs text-sidebar-muted">
                    {activeWorkspace.identifier}
                  </span>
                )}
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4 text-sidebar-muted" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Empresas
            </DropdownMenuLabel>
            {hasSearch && (
              <>
                <div className="px-2 py-1.5">
                  <div className="relative">
                    <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      ref={inputRef}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar empresa..."
                      className="h-8 pl-8 text-sm"
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            {!hasSearch && <DropdownMenuSeparator />}
            {hasSearch ? (
              <ScrollArea className="max-h-64">
                {filteredWorkspaces.length > 0 ? (
                  filteredWorkspaces.map((workspace) => (
                    <WorkspaceItem
                      key={workspace.id}
                      workspace={workspace}
                      isActive={workspace.id === activeWorkspaceId}
                      onSelect={() => onWorkspaceChange(workspace.id)}
                    />
                  ))
                ) : (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    Nenhuma empresa encontrada
                  </div>
                )}
              </ScrollArea>
            ) : (
              workspaces.map((workspace) => (
                <WorkspaceItem
                  key={workspace.id}
                  workspace={workspace}
                  isActive={workspace.id === activeWorkspaceId}
                  onSelect={() => onWorkspaceChange(workspace.id)}
                />
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export { WorkspaceSwitcher }
