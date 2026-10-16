import React, { useState } from 'react'
import { ClipboardCheck, CheckCircle2, Clock, RotateCcw, Loader2, User } from 'lucide-react'
import { Button, Card, Input } from '@bhubai/bhub-design-system'

function formatDateTime(isoStr) {
  if (!isoStr) return '—'
  try {
    return new Date(isoStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(isoStr)
  }
}

/**
 * Card "Conferência da competência" (Célula 24/09, item 4.1 / FIS-1090).
 *
 * Concluir marca a empresa × competência como conferida: o motor fiscal SN passa
 * a considerá-la apta ao DAS. Reabrir pede confirmação e preserva o histórico.
 */
export function ConferenciaCard({
  estado = null,
  loading = false,
  saving = false,
  competenciaLabel = '',
  disabledReason = null,
  // Falha ao LER a conferência: o card mostra o erro, nunca "pendente" (FIS-1253, PR-E).
  erroLeitura = null,
  onConcluir,
  onReabrir,
}) {
  const [observacao, setObservacao] = useState('')
  const [confirmandoReabertura, setConfirmandoReabertura] = useState(false)
  const [motivoReabertura, setMotivoReabertura] = useState('')

  const concluida = Boolean(estado?.concluida)
  const bloqueado = Boolean(disabledReason) || loading || saving

  const handleConcluir = async () => {
    await onConcluir?.(observacao.trim() || null)
    setObservacao('')
  }

  const handleReabrir = async () => {
    await onReabrir?.(motivoReabertura.trim() || null)
    setMotivoReabertura('')
    setConfirmandoReabertura(false)
  }

  return (
    <Card
      padding="none"
      className={`gap-0 p-5 ${
        concluida ? 'bg-success-subtle border-success-border' : ''
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Estado */}
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-md ${
              concluida ? 'bg-success-subtle text-success-text' : 'bg-warning-subtle text-warning-text'
            }`}
          >
            {concluida ? <CheckCircle2 className="w-5 h-5" /> : <ClipboardCheck className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Conferência da competência {competenciaLabel}
            </h3>
            {loading ? (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Consultando...
              </p>
            ) : erroLeitura ? (
              <p role="alert" className="text-sm text-destructive-text mt-1">
                Não foi possível consultar a conferência: {erroLeitura}
              </p>
            ) : concluida ? (
              <>
                <p className="text-sm text-success-text mt-1">
                  Conferência concluída em <strong>{formatDateTime(estado.concluidaEm)}</strong> por{' '}
                  <span className="inline-flex items-center gap-1 font-medium">
                    <User className="w-3.5 h-3.5 text-success-text" />
                    {estado.concluidaPor || 'desconhecido'}
                  </span>
                </p>
                {estado.observacao && (
                  <p className="text-xs text-muted-foreground mt-1 italic">“{estado.observacao}”</p>
                )}
                <p className="text-[11px] text-success-text mt-1">
                  A empresa está <strong>apta</strong> ao cálculo do DAS pelo motor fiscal SN nesta competência.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-foreground mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-warning-text" />
                  Conferência pendente
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Enquanto não for concluída, o motor fiscal SN <strong>não</strong> considera a empresa apta ao
                  DAS desta competência. Conclua depois de conferir faturamento e classificação.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-2 md:items-end md:min-w-[320px]">
          {disabledReason && (
            <p className="text-xs text-muted-foreground md:text-right">{disabledReason}</p>
          )}

          {!concluida && !loading && (
            <>
              <Input
                type="text"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Observação (opcional)"
                maxLength={2000}
                disabled={bloqueado}
                className="w-full h-auto px-2.5 py-1.5 text-sm"
              />
              <Button
                type="button"
                onClick={handleConcluir}
                disabled={bloqueado}
                title={disabledReason || 'Marca a empresa como conferida nesta competência'}
                variant="success"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Concluir conferência
              </Button>
            </>
          )}

          {concluida && !loading && !confirmandoReabertura && (
            <Button
              type="button"
              onClick={() => setConfirmandoReabertura(true)}
              disabled={bloqueado}
              title={disabledReason || 'Volta a empresa para "não conferida"; o histórico fica'}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reabrir conferência
            </Button>
          )}

          {concluida && confirmandoReabertura && (
            <div className="w-full bg-card border border-warning-border rounded-md p-3 space-y-2">
              <p className="text-xs text-warning-text font-medium">
                Reabrir tira a empresa de “apta ao DAS” nesta competência. Confirmar?
              </p>
              <Input
                type="text"
                value={motivoReabertura}
                onChange={(e) => setMotivoReabertura(e.target.value)}
                placeholder="Motivo (opcional)"
                maxLength={2000}
                disabled={saving}
                className="w-full h-auto px-2.5 py-1.5 text-sm"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  onClick={() => setConfirmandoReabertura(false)}
                  disabled={saving}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleReabrir}
                  disabled={saving}
                  variant="warning"
                  size="sm"
                  className="text-xs"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  Confirmar reabertura
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
