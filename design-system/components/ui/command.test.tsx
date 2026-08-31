import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'

import {
  Command,
  CommandItem,
  CommandList,
} from './command'

describe('Command', () => {
  it('CommandItem has cursor-pointer', async () => {
    const screen = await render(
      <Command>
        <CommandList>
          <CommandItem>Item</CommandItem>
        </CommandList>
      </Command>,
    )

    const item = page.getByRole('option', { name: 'Item' })
    await expect.element(item).toHaveClass(/cursor-pointer/)

    screen.unmount()
  })
})
