"use client"

import * as React from "react"
import {
  HomeIcon,
  InboxIcon,
  FolderIcon,
  SendIcon,
  BuildingIcon,
  CircleHelpIcon,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { SidebarLogo, type SidebarLogoProps } from "@/components/sidebar/sidebar-logo"
import {
  WorkspaceSwitcher,
  type Workspace,
} from "@/components/sidebar/workspace-switcher"
import { NavMain } from "@/components/sidebar/nav-main"
import {
  NavUser,
  type NavUserAction,
  type NavUserUser,
} from "@/components/sidebar/nav-user"
import { UpdateCard, type UpdateCardProps } from "@/components/sidebar/update-card"
import type { NavGroup } from "@/components/sidebar/nav-config"

const defaultWorkspaces: Workspace[] = [
  { id: "1", name: "Efferd", identifier: "12.345.678/0001-90" },
  { id: "2", name: "Acme Corp", identifier: "98.765.432/0001-10" },
  { id: "3", name: "Stark Industries", identifier: "11.222.333/0001-44" },
]

const defaultUser = {
  name: "Arthur Moreira",
  email: "arthur@bhub.com.br",
  scope: "Principal",
}

const defaultNavGroups: NavGroup[] = [
  {
    label: "Plataforma",
    items: [
      {
        title: "Página inicial",
        icon: HomeIcon,
        href: "/",
        isActive: true,
      },
      {
        title: "Tarefas",
        icon: InboxIcon,
        href: "/tarefas",
        badge: 10,
      },
      {
        title: "Documentos e relatórios",
        icon: FolderIcon,
        href: "/documentos",
        hasNotification: true,
        notificationTooltip: "Novos arquivos disponíveis",
      },
      {
        title: "Solicitações",
        icon: SendIcon,
        href: "/solicitacoes",
        items: [
          {
            title: "Realizar nova solicitação",
            icon: SendIcon,
            href: "/solicitacoes/nova",
          },
          {
            title: "Minhas solicitações",
            icon: SendIcon,
            href: "/solicitacoes/minhas",
          },
        ],
      },
    ],
  },
  {
    label: "Gestão",
    items: [
      {
        title: "Minha empresa",
        icon: BuildingIcon,
        href: "/empresa",
        items: [
          {
            title: "Gestão de acessos",
            icon: BuildingIcon,
            href: "/empresa/acessos",
          },
          {
            title: "Contas financeiras",
            icon: BuildingIcon,
            href: "/empresa/contas",
          },
          {
            title: "Cobranças BHub",
            icon: BuildingIcon,
            href: "/empresa/cobrancas",
          },
        ],
      },
      {
        title: "Central de Ajuda",
        icon: CircleHelpIcon,
        href: "/ajuda",
      },
    ],
  },
]

const defaultUpdateCard: UpdateCardProps = {
  title: "O que há de novo",
  description: "Últimas correções e novas funcionalidades.",
  href: "/changelog",
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  navGroups?: NavGroup[]
  /**
   * Update/announcement card shown in the footer. Acts as a feature-flag:
   * when omitted (or `enabled: false`), the card is not rendered.
   */
  updateCard?: UpdateCardProps
  disabledTooltip?: string
  /** Workspaces do switcher. `null` (ou `[]`) esconde o WorkspaceSwitcher. */
  workspaces?: Workspace[] | null
  /** Workspace ativo inicial (default: o primeiro). */
  defaultWorkspaceId?: string
  onWorkspaceChange?: (id: string) => void
  /** Usuário do rodapé. `null` esconde o NavUser. */
  user?: NavUserUser | null
  /** Itens do menu do usuário (ver `NavUser`). */
  userActions?: NavUserAction[]
  /** Ação "Sair" do menu do usuário. */
  onLogout?: () => void
  /** Customização do logo (expandido / colapsado / parceiro). */
  logo?: SidebarLogoProps
  /** Conteúdo extra no header, abaixo do logo/switcher. */
  headerContent?: React.ReactNode
  /** Conteúdo extra no rodapé, acima do usuário. */
  footerContent?: React.ReactNode
}

function AppSidebar({
  navGroups = defaultNavGroups,
  updateCard,
  disabledTooltip,
  workspaces = defaultWorkspaces,
  defaultWorkspaceId,
  onWorkspaceChange,
  user = defaultUser,
  userActions,
  onLogout,
  logo,
  headerContent,
  footerContent,
  ...props
}: AppSidebarProps) {
  const [activeWorkspaceId, setActiveWorkspaceId] = React.useState(
    defaultWorkspaceId ?? workspaces?.[0]?.id ?? ""
  )

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarLogo {...logo} />
        {workspaces && workspaces.length > 0 ? (
          <WorkspaceSwitcher
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspaceId}
            onWorkspaceChange={(id) => {
              setActiveWorkspaceId(id)
              onWorkspaceChange?.(id)
            }}
          />
        ) : null}
        {headerContent}
      </SidebarHeader>

      <SidebarContent>
        <NavMain navGroups={navGroups} disabledTooltip={disabledTooltip} />
      </SidebarContent>

      <SidebarFooter>
        {updateCard ? <UpdateCard {...updateCard} /> : null}
        {footerContent}
        {user ? (
          <NavUser user={user} actions={userActions} onLogout={onLogout} />
        ) : null}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

export { AppSidebar, defaultNavGroups, defaultUpdateCard }
export type { AppSidebarProps }
