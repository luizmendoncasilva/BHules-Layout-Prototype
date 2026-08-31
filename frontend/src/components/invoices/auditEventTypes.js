import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Cpu,
  Download,
  FileEdit,
  Lock,
  LockOpen,
  Play,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Undo2,
} from 'lucide-react'

// Aliases de exibição para api_source — evita expor o nome interno do
// orquestrador (RESTATE) e mostra termos do domínio fiscal.
const SOURCE_LABELS = {
  RESTATE: 'INTEGRADOR',
  INTEGRADOR_NF: 'INTEGRADOR',
}

export function displaySource(apiSource) {
  if (!apiSource) return '—'
  return SOURCE_LABELS[apiSource] ?? apiSource
}

const ACTOR_LABELS = {
  chupacabra: 'integrador',
}

export function displayActor(actor) {
  if (!actor) return actor
  return ACTOR_LABELS[actor] ?? actor
}

// Mapa event_type → apresentação. Centraliza copy + ícone num só lugar.
// Cada entry é {icon, label, format(payload) → string|null} usado pelo AuditTab.
export const AUDIT_EVENT_TYPES = {
  'invoice.ingested': {
    icon: Download,
    label: 'Nota ingerida',
    format: (p) =>
      p ? `via ${displaySource(p.api_source)} (${p.document_type ?? ''})` : null,
  },
  'invoice.engine.status_changed': {
    icon: Cpu,
    label: 'Motor avaliou',
    format: (p) =>
      p
        ? `${p.from ?? '—'} → ${p.to ?? '—'}` +
          (p.rules_count != null ? ` · ${p.rules_count} regras` : '')
        : null,
  },
  'invoice.auto_review.published': {
    icon: Bot,
    label: 'Auto-aprovação publicada',
    format: (p) => (p?.document_type ? p.document_type : null),
  },
  'invoice.feedback.upvote': {
    icon: ThumbsUp,
    label: 'Conferida (upvote)',
    format: (p) => p?.comment || null,
  },
  'invoice.feedback.downvote': {
    icon: ThumbsDown,
    label: 'Reprovada (downvote)',
    format: (p) => p?.comment || null,
  },
  'invoice.integration.locked': {
    icon: Lock,
    label: 'Integrada no Domínio',
    format: (p) => (p?.endpoint ? p.endpoint : null),
  },
  'invoice.integration.unlocked': {
    icon: LockOpen,
    label: 'Integração destravada',
    format: () => null,
  },
  'invoice.deleted': {
    icon: Trash2,
    label: 'Nota deletada',
    format: (p) => (p?.chave_nfe ? `chave ${p.chave_nfe}` : null),
  },
  'invoice.escrituracao.run_manual': {
    icon: Play,
    label: 'Escrituração reexecutada',
    format: (p) => {
      if (!p) return null
      const transition =
        p.prev_status !== p.new_status
          ? `${p.prev_status ?? '—'} → ${p.new_status ?? '—'}`
          : `permaneceu ${p.new_status ?? '—'}`
      return p.force ? `${transition} · force` : transition
    },
  },
  'invoice.escrituracao.feedback_submitted': {
    icon: FileEdit,
    label: 'Correções enviadas',
    format: (p) => {
      if (!p) return null
      const total = p.items_count ?? 0
      const corr = p.corrections_count ?? 0
      return `${total} item(s) · ${corr} correção(ões)`
    },
  },
  'invoice.escrituracao.undone': {
    icon: Undo2,
    label: 'Escrituração desfeita',
    format: (p) => (p?.batch_size ? `lote de ${p.batch_size}` : null),
  },
  'invoice.escrituracao.problem_reported': {
    icon: AlertTriangle,
    label: 'Problema relatado',
    format: (p) => p?.comment || null,
  },
}

export function getEventDisplay(eventType) {
  return (
    AUDIT_EVENT_TYPES[eventType] ?? {
      icon: CheckCircle2,
      label: eventType,
      format: () => null,
    }
  )
}
