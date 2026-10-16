import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { HomeIcon, InboxIcon, SendIcon, BuildingIcon } from 'lucide-react'

import { AppSidebar } from './app-sidebar'
import { SidebarInset, SidebarProvider } from './sidebar'
import { NavMain } from '@/components/sidebar/nav-main'
import { NavUser } from '@/components/sidebar/nav-user'
import { UpdateCard } from '@/components/sidebar/update-card'
import {
  WorkspaceSwitcher,
  type Workspace,
} from '@/components/sidebar/workspace-switcher'
import { SidebarLogo } from '@/components/sidebar/sidebar-logo'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from './sidebar'
import type { NavGroup } from '@/components/sidebar/nav-config'

// Use collapsible="none" for sub-component tests to avoid the `hidden md:block`
// class that hides sidebar content on narrow viewports in the test browser.

// ─── AppSidebar (orchestrator) ───────────────────────────────────────────────

describe('AppSidebar', () => {
  it('renders the full sidebar with all sections', async () => {
    const screen = await render(
      <SidebarProvider>
        <Sidebar variant="inset" collapsible="none">
          <SidebarHeader>
            <SidebarLogo />
          </SidebarHeader>
          <SidebarContent>
            <NavMain
              navGroups={[
                {
                  label: 'Plataforma',
                  items: [
                    { title: 'Página inicial', icon: HomeIcon, href: '/', isActive: true },
                    { title: 'Tarefas', icon: InboxIcon, href: '/tarefas', badge: 10 },
                  ],
                },
                {
                  label: 'Gestão',
                  items: [
                    { title: 'Central de Ajuda', icon: BuildingIcon, href: '/ajuda' },
                  ],
                },
              ]}
            />
          </SidebarContent>
          <SidebarFooter>
            <UpdateCard title="O que há de novo" description="Novidades." href="/changelog" />
            <NavUser user={{ name: 'Arthur Moreira', email: 'a@b.com', scope: 'Principal' }} />
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>,
    )

    // Navigation groups
    await expect.element(page.getByText('Plataforma')).toBeInTheDocument()
    await expect.element(page.getByText('Gestão')).toBeInTheDocument()

    // Menu items
    await expect.element(page.getByText('Página inicial')).toBeInTheDocument()
    await expect.element(page.getByText('Tarefas')).toBeInTheDocument()
    await expect.element(page.getByText('Central de Ajuda')).toBeInTheDocument()

    // User section
    await expect.element(page.getByText('Arthur Moreira')).toBeInTheDocument()

    // Update card
    await expect.element(page.getByText('O que há de novo')).toBeInTheDocument()

    screen.unmount()
  })
})

// ─── NavMain ─────────────────────────────────────────────────────────────────

describe('NavMain', () => {
  const navGroups: NavGroup[] = [
    {
      label: 'Plataforma',
      items: [
        { title: 'Home', icon: HomeIcon, href: '/', isActive: true },
        { title: 'Tarefas', icon: InboxIcon, href: '/tarefas', badge: 10 },
        { title: 'Envios', icon: SendIcon, href: '/envios' },
      ],
    },
    {
      label: 'Gestão',
      items: [
        { title: 'Empresa', icon: BuildingIcon, href: '/empresa' },
      ],
    },
  ]

  it('renders group labels', async () => {
    const screen = await render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarContent>
            <NavMain navGroups={navGroups} />
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>,
    )

    await expect.element(page.getByText('Plataforma')).toBeInTheDocument()
    await expect.element(page.getByText('Gestão')).toBeInTheDocument()

    screen.unmount()
  })

  it('renders all menu items', async () => {
    const screen = await render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarContent>
            <NavMain navGroups={navGroups} />
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>,
    )

    await expect.element(page.getByText('Home')).toBeInTheDocument()
    await expect.element(page.getByText('Tarefas')).toBeInTheDocument()
    await expect.element(page.getByText('Envios')).toBeInTheDocument()
    await expect.element(page.getByText('Empresa')).toBeInTheDocument()

    screen.unmount()
  })

  it('renders badge when provided', async () => {
    const screen = await render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarContent>
            <NavMain navGroups={navGroups} />
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>,
    )

    await expect.element(page.getByText('10')).toBeInTheDocument()

    screen.unmount()
  })

  it('marks active item with data-active', async () => {
    const screen = await render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarContent>
            <NavMain navGroups={navGroups} />
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>,
    )

    const button = screen.container.querySelector('[data-slot="sidebar-menu-button"][data-active="true"]')
    expect(button).not.toBeNull()

    screen.unmount()
  })

  it('disabled items have pointer-events-none and opacity-50', async () => {
    const groups: NavGroup[] = [
      {
        items: [
          { title: 'Disabled Item', icon: HomeIcon, href: '/', disabled: true },
        ],
      },
    ]

    const screen = await render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarContent>
            <NavMain navGroups={groups} />
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>,
    )

    const button = screen.container.querySelector('[data-slot="sidebar-menu-button"][aria-disabled]')
    expect(button).not.toBeNull()
    expect(button!.className).toMatch(/pointer-events-none/)
    expect(button!.className).toMatch(/opacity-50/)

    screen.unmount()
  })

  it('hides badge when item is disabled', async () => {
    const groups: NavGroup[] = [
      {
        items: [
          { title: 'Disabled', icon: HomeIcon, href: '/', disabled: true, badge: 5 },
        ],
      },
    ]

    const screen = await render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarContent>
            <NavMain navGroups={groups} />
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>,
    )

    const badge = screen.container.querySelector('[data-slot="sidebar-menu-badge"]')
    expect(badge).toBeNull()

    screen.unmount()
  })

  it('renders collapsible sub-menu items when active', async () => {
    const groups: NavGroup[] = [
      {
        items: [
          {
            title: 'Parent',
            icon: SendIcon,
            href: '/parent',
            isActive: true,
            items: [
              { title: 'Child A', icon: SendIcon, href: '/a' },
              { title: 'Child B', icon: SendIcon, href: '/b' },
            ],
          },
        ],
      },
    ]

    const screen = await render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarContent>
            <NavMain navGroups={groups} />
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>,
    )

    await expect.element(page.getByText('Parent')).toBeInTheDocument()
    // defaultOpen=true because isActive=true
    await expect.element(page.getByText('Child A')).toBeInTheDocument()
    await expect.element(page.getByText('Child B')).toBeInTheDocument()

    screen.unmount()
  })

  it('hides sub-menus when parent is disabled', async () => {
    const groups: NavGroup[] = [
      {
        items: [
          {
            title: 'Disabled Parent',
            icon: BuildingIcon,
            href: '/parent',
            disabled: true,
            items: [
              { title: 'Hidden Child', icon: BuildingIcon, href: '/child' },
            ],
          },
        ],
      },
    ]

    const screen = await render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarContent>
            <NavMain navGroups={groups} />
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>,
    )

    await expect.element(page.getByText('Disabled Parent')).toBeInTheDocument()
    await expect.element(page.getByText('Hidden Child')).not.toBeInTheDocument()

    screen.unmount()
  })

  it('renders without group label when label is undefined', async () => {
    const groups: NavGroup[] = [
      {
        items: [
          { title: 'No Label Item', icon: HomeIcon, href: '/' },
        ],
      },
    ]

    const screen = await render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarContent>
            <NavMain navGroups={groups} />
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>,
    )

    await expect.element(page.getByText('No Label Item')).toBeInTheDocument()
    const groupLabel = screen.container.querySelector('[data-slot="sidebar-group-label"]')
    expect(groupLabel).toBeNull()

    screen.unmount()
  })

  it('renders notification dot for items with hasNotification', async () => {
    const groups: NavGroup[] = [
      {
        items: [
          {
            title: 'Docs',
            icon: HomeIcon,
            href: '/docs',
            hasNotification: true,
            notificationTooltip: 'New files',
          },
        ],
      },
    ]

    const screen = await render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarContent>
            <NavMain navGroups={groups} />
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>,
    )

    const dot = screen.container.querySelector('[data-slot="notification-dot"]')
    expect(dot).not.toBeNull()

    screen.unmount()
  })
})

// ─── NavUser ─────────────────────────────────────────────────────────────────

describe('NavUser', () => {
  const user = {
    name: 'Arthur Moreira',
    email: 'arthur@bhub.com.br',
    scope: 'Principal',
  }

  it('renders user name and scope', async () => {
    const screen = await render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarFooter>
            <NavUser user={user} />
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>,
    )

    await expect.element(page.getByText('Arthur Moreira')).toBeInTheDocument()
    await expect.element(page.getByText('Principal')).toBeInTheDocument()

    screen.unmount()
  })

  it('renders avatar with initials fallback', async () => {
    const screen = await render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarFooter>
            <NavUser user={user} />
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>,
    )

    await expect.element(page.getByText('AM')).toBeInTheDocument()

    screen.unmount()
  })

  it('renders status indicator dot', async () => {
    const screen = await render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarFooter>
            <NavUser user={user} />
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>,
    )

    const statusDot = screen.container.querySelector('.bg-sidebar-success')
    expect(statusDot).not.toBeNull()

    screen.unmount()
  })

  it('opens dropdown menu on click', async () => {
    const screen = await render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarFooter>
            <NavUser user={user} />
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>,
    )

    const trigger = page.getByText('Arthur Moreira')
    await trigger.click()

    await expect.element(page.getByText('Configurações do usuário')).toBeVisible()
    await expect.element(page.getByText('Solicitar troca de permissão')).toBeVisible()
    await expect.element(page.getByText('Sair')).toBeVisible()

    screen.unmount()
  })
})

// ─── WorkspaceSwitcher ───────────────────────────────────────────────────────

describe('WorkspaceSwitcher', () => {
  const workspaces: Workspace[] = [
    { id: '1', name: 'Efferd', identifier: '12.345.678/0001-90' },
    { id: '2', name: 'Acme Corp', identifier: '98.765.432/0001-10' },
    { id: '3', name: 'Stark Industries', identifier: '11.222.333/0001-44' },
  ]

  it('renders the active workspace name', async () => {
    const screen = await render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarHeader>
            <WorkspaceSwitcher
              workspaces={workspaces}
              activeWorkspaceId="1"
              onWorkspaceChange={() => {}}
            />
          </SidebarHeader>
        </Sidebar>
      </SidebarProvider>,
    )

    await expect.element(page.getByText('Efferd')).toBeInTheDocument()
    await expect.element(page.getByText('12.345.678/0001-90')).toBeInTheDocument()

    screen.unmount()
  })

  it('renders avatar with first letter of workspace name', async () => {
    const screen = await render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarHeader>
            <WorkspaceSwitcher
              workspaces={workspaces}
              activeWorkspaceId="1"
              onWorkspaceChange={() => {}}
            />
          </SidebarHeader>
        </Sidebar>
      </SidebarProvider>,
    )

    const fallback = screen.container.querySelector('[data-slot="avatar-fallback"]')
    expect(fallback).not.toBeNull()
    expect(fallback!.textContent).toBe('E')

    screen.unmount()
  })

  it('opens dropdown and shows all workspaces', async () => {
    const screen = await render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarHeader>
            <WorkspaceSwitcher
              workspaces={workspaces}
              activeWorkspaceId="1"
              onWorkspaceChange={() => {}}
            />
          </SidebarHeader>
        </Sidebar>
      </SidebarProvider>,
    )

    const trigger = page.getByText('Efferd')
    await trigger.click()

    await expect.element(page.getByText('Acme Corp')).toBeVisible()
    await expect.element(page.getByText('Stark Industries')).toBeVisible()

    screen.unmount()
  })

  it('calls onWorkspaceChange when selecting a workspace', async () => {
    const onChange = vi.fn()

    const screen = await render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarHeader>
            <WorkspaceSwitcher
              workspaces={workspaces}
              activeWorkspaceId="1"
              onWorkspaceChange={onChange}
            />
          </SidebarHeader>
        </Sidebar>
      </SidebarProvider>,
    )

    const trigger = page.getByText('Efferd')
    await trigger.click()

    const acme = page.getByText('Acme Corp')
    await acme.click()

    expect(onChange).toHaveBeenCalledWith('2')

    screen.unmount()
  })

  it('shows search when more than 5 workspaces', async () => {
    const manyWorkspaces: Workspace[] = Array.from({ length: 8 }, (_, i) => ({
      id: String(i + 1),
      name: `Company ${i + 1}`,
      identifier: `00.000.000/000${i + 1}-00`,
    }))

    const screen = await render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarHeader>
            <WorkspaceSwitcher
              workspaces={manyWorkspaces}
              activeWorkspaceId="1"
              onWorkspaceChange={() => {}}
            />
          </SidebarHeader>
        </Sidebar>
      </SidebarProvider>,
    )

    const trigger = page.getByText('Company 1')
    await trigger.click()

    const searchInput = page.getByPlaceholder('Buscar empresa...')
    await expect.element(searchInput).toBeVisible()

    screen.unmount()
  })

  it('does not show search when 5 or fewer workspaces', async () => {
    const screen = await render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarHeader>
            <WorkspaceSwitcher
              workspaces={workspaces}
              activeWorkspaceId="1"
              onWorkspaceChange={() => {}}
            />
          </SidebarHeader>
        </Sidebar>
      </SidebarProvider>,
    )

    const trigger = page.getByText('Efferd')
    await trigger.click()

    const searchInput = page.getByPlaceholder('Buscar empresa...')
    await expect.element(searchInput).not.toBeInTheDocument()

    screen.unmount()
  })
})

// ─── UpdateCard ──────────────────────────────────────────────────────────────

describe('UpdateCard', () => {
  it('renders title, description and link', async () => {
    const screen = await render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarFooter>
            <UpdateCard
              title="O que há de novo"
              description="Últimas correções."
              href="/changelog"
            />
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>,
    )

    await expect.element(page.getByText('O que há de novo')).toBeInTheDocument()
    await expect.element(page.getByText('Últimas correções.')).toBeInTheDocument()
    await expect.element(page.getByText('Saiba mais')).toBeInTheDocument()

    screen.unmount()
  })

  it('renders default label ATUALIZAÇÃO', async () => {
    const screen = await render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarFooter>
            <UpdateCard
              title="Title"
              description="Desc"
              href="/link"
            />
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>,
    )

    await expect.element(page.getByText('ATUALIZAÇÃO')).toBeInTheDocument()

    screen.unmount()
  })

  it('renders custom label', async () => {
    const screen = await render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarFooter>
            <UpdateCard
              label="NOVIDADE"
              title="Title"
              description="Desc"
              href="/link"
            />
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>,
    )

    await expect.element(page.getByText('NOVIDADE')).toBeInTheDocument()

    screen.unmount()
  })

  it('has data-slot attribute', async () => {
    const screen = await render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarFooter>
            <UpdateCard
              title="Title"
              description="Desc"
              href="/link"
            />
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>,
    )

    const card = screen.container.querySelector('[data-slot="update-card"]')
    expect(card).not.toBeNull()

    screen.unmount()
  })

  it('is hidden when sidebar is collapsed', async () => {
    const screen = await render(
      <SidebarProvider defaultOpen={false}>
        <Sidebar collapsible="none">
          <SidebarFooter>
            <UpdateCard
              title="Hidden Card"
              description="Desc"
              href="/link"
            />
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>,
    )

    // UpdateCard checks state === "collapsed" and returns null
    await expect.element(page.getByText('Hidden Card')).not.toBeInTheDocument()

    screen.unmount()
  })

  it('is not rendered when enabled is false (feature-flag off)', async () => {
    const screen = await render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarFooter>
            <UpdateCard
              enabled={false}
              title="Flagged Off"
              description="Desc"
              href="/link"
            />
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>,
    )

    await expect.element(page.getByText('Flagged Off')).not.toBeInTheDocument()
    expect(screen.container.querySelector('[data-slot="update-card"]')).toBeNull()

    screen.unmount()
  })

  it('renders a custom CTA label', async () => {
    const screen = await render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarFooter>
            <UpdateCard
              title="Title"
              description="Desc"
              href="/link"
              cta="Ver novidades"
            />
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>,
    )

    await expect.element(page.getByText('Ver novidades')).toBeInTheDocument()

    screen.unmount()
  })

  it('shows a dismiss button and calls onDismiss when provided', async () => {
    const onDismiss = vi.fn()

    const screen = await render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarFooter>
            <UpdateCard
              title="Title"
              description="Desc"
              href="/link"
              onDismiss={onDismiss}
            />
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>,
    )

    const dismiss = screen.container.querySelector(
      '[data-slot="update-card-dismiss"]',
    ) as HTMLButtonElement | null
    expect(dismiss).not.toBeNull()

    dismiss!.click()
    expect(onDismiss).toHaveBeenCalledTimes(1)

    screen.unmount()
  })
})

// ─── SidebarLogo ─────────────────────────────────────────────────────────────

describe('SidebarLogo', () => {
  it('renders the default BHub logo', async () => {
    const screen = await render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarHeader>
            <SidebarLogo />
          </SidebarHeader>
        </Sidebar>
      </SidebarProvider>,
    )

    const logo = screen.container.querySelector('[data-slot="sidebar-logo"]')
    expect(logo).not.toBeNull()

    const svg = logo!.querySelector('svg')
    expect(svg).not.toBeNull()

    screen.unmount()
  })

  it('renders custom expanded logo', async () => {
    const screen = await render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarHeader>
            <SidebarLogo expandedLogo={<span>Custom</span>} />
          </SidebarHeader>
        </Sidebar>
      </SidebarProvider>,
    )

    await expect.element(page.getByText('Custom')).toBeInTheDocument()

    screen.unmount()
  })

  it('renders partner logo with separator', async () => {
    const screen = await render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarHeader>
            <SidebarLogo partnerLogo={<span>Partner</span>} />
          </SidebarHeader>
        </Sidebar>
      </SidebarProvider>,
    )

    await expect.element(page.getByText('Partner')).toBeInTheDocument()

    const separator = screen.container.querySelector('[data-slot="sidebar-logo"] .bg-sidebar-border')
    expect(separator).not.toBeNull()

    screen.unmount()
  })
})
