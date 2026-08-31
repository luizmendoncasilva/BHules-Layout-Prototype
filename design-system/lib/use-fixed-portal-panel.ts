"use client"

import * as React from "react"

export type PortalContainer =
  | HTMLElement
  | (() => HTMLElement | null | undefined)

export type FixedPortalPanelOptions = {
  portalContainer?: PortalContainer
  zIndex?: number
}

export type PanelCoords = {
  top: number
  left: number
}

export const DEFAULT_PORTAL_Z_INDEX = 9999

const PANEL_OFFSET = 6

export function resolvePortalContainer(
  container?: PortalContainer
): HTMLElement {
  if (!container) {
    return document.body
  }

  if (typeof container === "function") {
    return container() ?? document.body
  }

  return container
}

export function getPanelCoords(anchor: HTMLElement): PanelCoords {
  const rect = anchor.getBoundingClientRect()

  return {
    top: rect.bottom + PANEL_OFFSET,
    left: rect.left,
  }
}

export function useFixedPortalPanel<
  TPanel extends HTMLElement = HTMLDivElement,
>({
  portalContainer,
  zIndex = DEFAULT_PORTAL_Z_INDEX,
}: FixedPortalPanelOptions = {}) {
  const [open, setOpen] = React.useState(false)
  const [coords, setCoords] = React.useState<PanelCoords | null>(null)
  const anchorRef = React.useRef<HTMLDivElement>(null)
  const panelRef = React.useRef<TPanel>(null)
  const panelId = React.useId()

  const closePanel = React.useCallback(() => {
    setOpen(false)
    setCoords(null)
  }, [])

  const openPanel = React.useCallback(() => {
    if (!anchorRef.current) return

    setCoords(getPanelCoords(anchorRef.current))
    setOpen(true)
  }, [])

  const togglePanel = React.useCallback(() => {
    if (open) {
      closePanel()
      return
    }

    openPanel()
  }, [closePanel, open, openPanel])

  React.useEffect(() => {
    if (!open) return

    const updateCoords = () => {
      if (!anchorRef.current) return
      setCoords(getPanelCoords(anchorRef.current))
    }

    window.addEventListener("resize", updateCoords)
    window.addEventListener("scroll", updateCoords, true)

    return () => {
      window.removeEventListener("resize", updateCoords)
      window.removeEventListener("scroll", updateCoords, true)
    }
  }, [open])

  React.useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node

      if (anchorRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return

      closePanel()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanel()
    }

    const timer = window.setTimeout(() => {
      document.addEventListener("pointerdown", handlePointerDown, true)
    }, 0)

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      window.clearTimeout(timer)
      document.removeEventListener("pointerdown", handlePointerDown, true)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [closePanel, open])

  return {
    open,
    coords,
    anchorRef,
    panelRef,
    panelId,
    zIndex,
    closePanel,
    openPanel,
    togglePanel,
    getPortalContainer: () => resolvePortalContainer(portalContainer),
  }
}
