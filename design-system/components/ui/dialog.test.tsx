import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from './dialog'

describe('Dialog', () => {
  it('DialogClose has cursor-pointer', async () => {
    const screen = await render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    )

    const closeButton = page.getByRole('button', { name: 'Close' })
    await expect.element(closeButton).toHaveClass(/cursor-pointer/)

    screen.unmount()
  })
})
