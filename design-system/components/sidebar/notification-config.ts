/**
 * NotificationBell data contract.
 *
 * In production, map your API payload to `Notification` and pass the array
 * via the `notifications` prop on `<NotificationBell />`.
 */

type Notification = {
  /** Stable unique id from the backend */
  id: string
  title: string
  description?: string
  /** Relative or formatted timestamp label (e.g. "2 min", "Ontem") */
  time: string
  read?: boolean
  /** Optional deep-link when the user clicks the notification */
  href?: string
}

/**
 * Mock data for Storybook and local development.
 * Do not use in production — replace with real notifications from your API.
 */
const mockNotifications: Notification[] = [
  {
    id: "mock-doc-mar-2026",
    title: "Novo documento disponível",
    description: "Relatório mensal de março foi publicado.",
    time: "2 min",
    read: false,
    href: "/documentos",
  },
  {
    id: "mock-task-jun-2026",
    title: "Tarefa com vencimento próximo",
    description:
      "Sua tarefa para envio de extratos de junho/26 está próxima do vencimento",
    time: "1 h",
    read: false,
    href: "/tarefas",
  },
  {
    id: "mock-request-13245",
    title: "Solicitação atualizada",
    description:
      "Sua solicitação #13245 de admissão precisa de uma resposta",
    time: "Ontem",
    read: false,
    href: "/solicitacoes/13245",
  },
]

export type { Notification }
export { mockNotifications }
