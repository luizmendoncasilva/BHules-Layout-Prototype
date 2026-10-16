import { Bell, AlertTriangle, XCircle, DollarSign, ShieldAlert } from 'lucide-react'

// Tipos de alerta do motor, em ordem de gravidade (order). Compartilhado entre
// o painel completo (AlertsPanel) e a prévia do sino (AppHeader).
export const TYPE_CONFIG = {
  VALIDACAO_BLOQUEANTE: {
    icon: ShieldAlert,
    label: 'Validação bloqueante',
    descricao: 'A nota não pode ser escriturada até a correção.',
    text: 'text-destructive-text',
    chip: 'bg-destructive-subtle text-destructive-text',
    order: 0,
  },
  DIVERGENCIA_CRITICA: {
    icon: XCircle,
    label: 'Divergência crítica',
    descricao: 'O que o emitente informou difere do que o motor calcula.',
    text: 'text-destructive-text',
    chip: 'bg-destructive-subtle text-destructive-text',
    order: 1,
  },
  IMPACTO_FINANCEIRO_ALTO: {
    icon: DollarSign,
    label: 'Impacto financeiro',
    descricao: 'Diferença de imposto acima do limite configurado.',
    text: 'text-info-text',
    chip: 'bg-info-subtle text-info-text',
    order: 2,
  },
  CONFIANCA_BAIXA: {
    icon: AlertTriangle,
    label: 'Confiança baixa',
    descricao: 'A classificação automática precisa de conferência.',
    text: 'text-warning-text',
    chip: 'bg-warning-subtle text-warning-text',
    order: 3,
  },
}

export function configDoAlerta(type) {
  return TYPE_CONFIG[type] || {
    icon: Bell, label: type, descricao: '', text: 'text-muted-foreground', chip: 'bg-muted text-muted-foreground', order: 9,
  }
}

// Uma linha curta descrevendo o alerta (prévia do sino e título do item).
export function resumoDoAlerta(alert) {
  const d = alert.details
  if (alert.type === 'DIVERGENCIA_CRITICA' && Array.isArray(d)) {
    return d.map((x) => x.campo).join(', ') + (d.length === 1 ? ' divergente' : ' divergentes')
  }
  if (Array.isArray(d)) return d[0] || ''
  return d || ''
}

export function tempoRelativo(ts, agora = Date.now()) {
  if (!ts) return ''
  const diff = Math.max(0, agora - new Date(ts).getTime())
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h} h`
  const dias = Math.floor(h / 24)
  if (dias === 1) return 'ontem'
  if (dias < 7) return `há ${dias} dias`
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function dataHoraCompleta(ts) {
  return ts ? new Date(ts).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : ''
}

// Agrupa por período (Hoje / Ontem / Últimos 7 dias / Anteriores), mantendo a ordem.
export function agruparPorPeriodo(alerts, agora = new Date()) {
  const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).getTime()
  const DIA = 86400000
  const grupos = [
    { id: 'hoje', label: 'Hoje', itens: [] },
    { id: 'ontem', label: 'Ontem', itens: [] },
    { id: 'semana', label: 'Últimos 7 dias', itens: [] },
    { id: 'antes', label: 'Anteriores', itens: [] },
  ]
  for (const a of alerts) {
    const t = new Date(a.timestamp).getTime()
    if (t >= inicioHoje) grupos[0].itens.push(a)
    else if (t >= inicioHoje - DIA) grupos[1].itens.push(a)
    else if (t >= inicioHoje - 7 * DIA) grupos[2].itens.push(a)
    else grupos[3].itens.push(a)
  }
  return grupos.filter((g) => g.itens.length > 0)
}
