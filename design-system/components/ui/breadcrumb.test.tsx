import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from './breadcrumb'

describe('Breadcrumb', () => {
  it('BreadcrumbLink has cursor-pointer', async () => {
    const screen = await render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Home</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    )

    const link = page.getByRole('link', { name: 'Home' })
    await expect.element(link).toHaveClass(/cursor-pointer/)

    screen.unmount()
  })
})
