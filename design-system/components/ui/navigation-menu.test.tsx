import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from './navigation-menu'

describe('NavigationMenu', () => {
  it('NavigationMenuTrigger has cursor-pointer', async () => {
    const screen = await render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    )

    const trigger = page.getByRole('button', { name: 'Menu' })
    await expect.element(trigger).toHaveClass(/cursor-pointer/)

    screen.unmount()
  })

  it('NavigationMenuTrigger has pointer-events-none when disabled', async () => {
    const screen = await render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger disabled>Menu</NavigationMenuTrigger>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    )

    const trigger = page.getByRole('button', { name: 'Menu' })
    await expect.element(trigger).toHaveAttribute('disabled', '')
    await expect.element(trigger).toHaveClass(/disabled:pointer-events-none/)
    await expect.element(trigger).toHaveClass(/disabled:opacity-50/)

    screen.unmount()
  })

  it('NavigationMenuLink has cursor-pointer', async () => {
    const screen = await render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="#">Nav Link</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    )

    const link = page.getByText('Nav Link')
    await expect.element(link).toHaveClass(/cursor-pointer/)

    screen.unmount()
  })
})
