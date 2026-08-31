import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { LayoutDashboardIcon, UsersIcon, BarChartIcon, SettingsIcon, FileTextIcon } from 'lucide-react'

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'

const meta = {
  title: 'BSystem/NavigationMenu',
  component: NavigationMenu,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof NavigationMenu>

export default meta
type Story = StoryObj<typeof meta>

// ─── Default ─────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-1 p-2 w-64">
              <li>
                <NavigationMenuLink href="#" className="font-medium">
                  Introduction
                  <span className="text-muted-foreground text-xs font-normal">
                    What is BSystem and how to use it.
                  </span>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#">
                  Installation
                  <span className="text-muted-foreground text-xs font-normal">
                    How to install dependencies and structure your app.
                  </span>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#">
                  Typography
                  <span className="text-muted-foreground text-xs font-normal">
                    Styles for headings, paragraphs, lists…
                  </span>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>Components</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid grid-cols-2 gap-1 p-2 w-[380px]">
              {(
                [
                  { icon: LayoutDashboardIcon, label: 'Dashboard', desc: 'Overview & metrics' },
                  { icon: UsersIcon, label: 'Users', desc: 'User management' },
                  { icon: BarChartIcon, label: 'Analytics', desc: 'Performance data' },
                  { icon: FileTextIcon, label: 'Reports', desc: 'Export & share' },
                ] as const
              ).map(({ icon: Icon, label, desc }) => (
                <li key={label}>
                  <NavigationMenuLink href="#">
                    <span className="flex items-center gap-2 font-medium">
                      <Icon className="size-4 text-muted-foreground" />
                      {label}
                    </span>
                    <span className="text-muted-foreground text-xs font-normal">{desc}</span>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink href="#" className={navigationMenuTriggerStyle()}>
            Documentation
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
}

// ─── Simple Links ─────────────────────────────────────────────────────────────

export const SimpleLinks: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        {(['Home', 'Products', 'Pricing', 'Blog', 'Contact'] as const).map((item) => (
          <NavigationMenuItem key={item}>
            <NavigationMenuLink href="#" className={navigationMenuTriggerStyle()}>
              {item}
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  ),
}

// ─── With Active State ────────────────────────────────────────────────────────

export const WithActiveState: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink href="#" className={navigationMenuTriggerStyle()} data-active>
            Dashboard
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#" className={navigationMenuTriggerStyle()}>
            Projects
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#" className={navigationMenuTriggerStyle()}>
            Team
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
}

// ─── With Icons ───────────────────────────────────────────────────────────────

export const WithIcons: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        {(
          [
            { icon: LayoutDashboardIcon, label: 'Dashboard' },
            { icon: UsersIcon, label: 'Team' },
            { icon: BarChartIcon, label: 'Analytics' },
            { icon: SettingsIcon, label: 'Settings' },
          ] as const
        ).map(({ icon: Icon, label }) => (
          <NavigationMenuItem key={label}>
            <NavigationMenuLink href="#" className={navigationMenuTriggerStyle()}>
              <Icon />
              {label}
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  ),
}
