import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'

import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

describe('Tabs', () => {
  it('TabsTrigger has cursor-pointer', async () => {
    const screen = await render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content</TabsContent>
      </Tabs>,
    )

    const tab = page.getByRole('tab', { name: 'Tab 1' })
    await expect.element(tab).toHaveClass(/cursor-pointer/)

    screen.unmount()
  })

  it('TabsTrigger has pointer-events-none when disabled', async () => {
    const screen = await render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" disabled>Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content</TabsContent>
      </Tabs>,
    )

    const tab = page.getByRole('tab', { name: 'Tab 1' })
    await expect.element(tab).toHaveAttribute('disabled', '')
    await expect.element(tab).toHaveClass(/disabled:pointer-events-none/)
    await expect.element(tab).toHaveClass(/disabled:opacity-50/)

    screen.unmount()
  })
})
