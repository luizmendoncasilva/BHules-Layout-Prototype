import { Badge } from '@bhubai/bhub-design-system'

// Tons "subtle" (fundo claro + texto colorido) em vez das variantes sólidas
// do Badge — mais adequado para chips de status repetidos em tabela densa.
const TONE_CLASSES = {
  success: 'bg-success-subtle text-success-text border-success-border',
  destructive: 'bg-destructive-subtle text-destructive-text border-destructive-border',
  warning: 'bg-warning-subtle text-warning-text border-warning-border',
  info: 'bg-info-subtle text-info-text border-info-border',
  secondary: 'bg-muted text-muted-foreground border-border',
}

const STATUS_MAP = {
  // NF-e status
  SUCESSO:        { tone: 'success', dot: 'bg-success', label: 'Sucesso' },
  VERIFICAR:      { tone: 'destructive', dot: 'bg-destructive', label: 'Verificar' },
  APROVADA:       { tone: 'success', dot: 'bg-success', label: 'Aprovada' },
  Aprovada:       { tone: 'success', dot: 'bg-success', label: 'Aprovada' },
  Capturada:      { tone: 'success', dot: 'bg-success', label: 'Capturada' },
  ISSUED:         { tone: 'success', dot: 'bg-success', label: 'Capturada' },
  COM_ERROS:      { tone: 'destructive', dot: 'bg-destructive', label: 'Contém Erros' },
  'Contém Erros': { tone: 'destructive', dot: 'bg-destructive', label: 'Contém Erros' },
  PENDENTE:       { tone: 'warning', dot: 'bg-warning', label: 'Pendente' },
  'Aguardando Envio': { tone: 'warning', dot: 'bg-warning', label: 'Aguardando Envio' },
  REJEITADA:      { tone: 'secondary', dot: 'bg-neutral-400', label: 'Rejeitada' },
  Cancelada:      { tone: 'secondary', dot: 'bg-neutral-400', label: 'Cancelada' },
  CANCELLED:      { tone: 'secondary', dot: 'bg-neutral-400', label: 'Cancelada' },
  NAO_VALIDADA:   { tone: 'secondary', dot: 'bg-neutral-400', label: 'Não Validada' },
  // Status análise
  CONFORME:       { tone: 'success', dot: 'bg-success', label: 'Conforme' },
  REQUER_REVISAO: { tone: 'warning', dot: 'bg-warning', label: 'Requer Revisão' },
  BLOQUEADO:      { tone: 'destructive', dot: 'bg-destructive', label: 'Bloqueado' },
  BLOQUEADA:      { tone: 'destructive', dot: 'bg-destructive', label: 'Bloqueada' },
  DISPENSADO:     { tone: 'secondary', dot: 'bg-neutral-400', label: 'Dispensada' },
  DISPENSADA:     { tone: 'secondary', dot: 'bg-neutral-400', label: 'Dispensada' },
  ESCRITURADA:    { tone: 'info', dot: 'bg-info', label: 'Escriturada' },
  // NFS-e
  ANALISADA:      { tone: 'success', dot: 'bg-success', label: 'Analisada' },
  REVISAO_HUMANA: { tone: 'warning', dot: 'bg-warning', label: 'Requer Revisão' },
  NAO_ANALISADA:  { tone: 'destructive', dot: 'bg-destructive', label: 'Não Analisada' },
  CONFIANCA_BAIXA:{ tone: 'warning', dot: 'bg-warning', label: 'Conf. Baixa' },
  // Integração
  ENVIADO:        { tone: 'success', dot: 'bg-success', label: 'Enviado' },
  ERRO:           { tone: 'destructive', dot: 'bg-destructive', label: 'Erro' },
}

export default function StatusBadge({ status }) {
  const config = STATUS_MAP[status] || {
    tone: 'secondary',
    dot: 'bg-neutral-400',
    label: status,
  }

  return (
    <Badge variant="outline" className={TONE_CLASSES[config.tone]}>
      {config.label}
    </Badge>
  )
}
