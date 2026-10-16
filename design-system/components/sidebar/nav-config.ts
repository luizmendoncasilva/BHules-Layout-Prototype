import type * as React from "react"
import type { LucideIcon } from "lucide-react"

type NavItem = {
  title: string
  /**
   * Ícone do item. Obrigatório no primeiro nível (é o que aparece no modo
   * colapsado); opcional nos sub-itens.
   */
  icon?: LucideIcon | React.ComponentType<{ className?: string }>
  /** Link do item. Quando omitido (SPA sem router), use `onClick`. */
  href?: string
  /** Chave estável do item (default: `title`). */
  id?: string
  /**
   * Ação do item (navegação de SPA, por exemplo).
   * - Item folha: chamado ao clicar.
   * - Item com `items` (grupo): o clique no modo expandido só abre/fecha o
   *   grupo; `onClick` é chamado apenas quando a sidebar está colapsada
   *   (modo ícone), junto com a expansão da sidebar.
   */
  onClick?: () => void
  badge?: string | number
  isActive?: boolean
  disabled?: boolean
  hasNotification?: boolean
  notificationTooltip?: string
  /** Sub-itens. Aceita aninhamento em qualquer profundidade. */
  items?: NavItem[]
}

type NavGroup = {
  label?: string
  items: NavItem[]
}

export type { NavItem, NavGroup }
