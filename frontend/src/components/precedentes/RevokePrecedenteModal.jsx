// frontend/src/components/precedentes/RevokePrecedenteModal.jsx
import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { RotateCcw, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { api } from '../../api/client'
import { formatCnpj } from '../../utils/cnpj'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button, Textarea, Label, Spinner,
} from '@bhubai/bhub-design-system'

/**
 * Modal de revogação LÓGICA de um precedente integrado (Frente C5).
 *
 * Estados: LOADING_PREVIEW → CONFIRM → REVOKING → DONE | FAILED.
 *
 * A revogação NÃO apaga nada: marca o precedente como revogado e reenfileira
 * as notas que o usaram para reprocesso (SEM publicar no Onvio). Por ser
 * reversível, a fricção certa é exigir um motivo (auditado) — não um
 * word-gate "digite REVOGAR".
 *
 * Props:
 * - `target`: { companyId, emitenteCnpj, ncm } da chave do precedente
 *   (null = modal fechado). Espelha o padrão de `company` no DeleteCompanyModal.
 * - `onClose`: chamado em cancelar/fechar (sem efeito no parent).
 * - `onRevoked`: chamado após sucesso (parent deve refetch a nota/decisão).
 */
export default function RevokePrecedenteModal({ target, onClose, onRevoked }) {
  const [phase, setPhase] = useState('LOADING_PREVIEW')
  const [preview, setPreview] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [motivo, setMotivo] = useState('')
  const [result, setResult] = useState(null)

  const queryClient = useQueryClient()

  const companyId = target?.companyId
  const emitenteCnpj = target?.emitenteCnpj
  const ncm = target?.ncm

  // Carrega o preview (não-mutante) ao abrir numa nova chave de precedente.
  useEffect(() => {
    if (!target) return
    setPhase('LOADING_PREVIEW')
    setPreview(null)
    setErrorMsg('')
    setMotivo('')
    setResult(null)

    let cancelled = false
    api.getRevokePrecedentePreview(companyId, emitenteCnpj, ncm)
      .then((data) => { if (!cancelled) { setPreview(data); setPhase('CONFIRM') } })
      .catch((err) => {
        if (!cancelled) {
          setErrorMsg(err?.message || 'Falha ao carregar preview')
          setPhase('FAILED')
        }
      })
    return () => { cancelled = true }
  }, [target, companyId, emitenteCnpj, ncm])

  const revokeMutation = useMutation({
    mutationFn: () =>
      api.revogarPrecedente(companyId, { emitenteCnpj, ncm, motivo: motivo.trim() }),
    onMutate: () => { setPhase('REVOKING'); setErrorMsg('') },
    onSuccess: (data) => {
      setResult(data)
      setPhase('DONE')
      // Reprocesso foi enfileirado: a nota/decisão atual ficará desatualizada.
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['escrituracao'] })
      queryClient.invalidateQueries({ queryKey: ['statusCounts'] })
    },
    onError: (err) => {
      setErrorMsg(parseError(err))
      setPhase('FAILED')
    },
  })

  // Autofocus no motivo quando entra na fase CONFIRM (só há precedente p/ revogar).
  const canRevoke = preview?.found && !preview?.ja_revogado
  useEffect(() => {
    if (phase === 'CONFIRM' && canRevoke) {
      // microtask: garante que o textarea já está montado
      const id = setTimeout(() => document.getElementById('revoke-motivo')?.focus(), 0)
      return () => clearTimeout(id)
    }
  }, [phase, canRevoke])

  if (!target) return null

  const motivoEmpty = !motivo.trim()
  const busy = phase === 'REVOKING'

  return (
    <Dialog open={!!target} onOpenChange={(o) => { if (!o && !busy) onClose?.() }}>
      <DialogContent
        showCloseButton={!busy}
        className="sm:max-w-[520px] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border text-left">
          <div className="flex items-center gap-3 pr-6">
            <div className="w-9 h-9 rounded-lg bg-warning-subtle flex items-center justify-center">
              <RotateCcw className="w-4 h-4 text-warning-text" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                Revogar Precedente Integrado
              </DialogTitle>
              <DialogDescription className="text-xs">
                Reversível — fica registrado na auditoria.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {/* Chave do precedente */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Precedente</p>
            <div className="flex flex-col gap-0.5 text-sm">
              <span className="text-foreground">
                Emitente: <span className="font-mono text-foreground">{formatCnpj(emitenteCnpj)}</span>
              </span>
              <span className="text-foreground">
                NCM: <span className="font-mono text-foreground">{ncm || '-'}</span>
              </span>
            </div>
          </div>

          {phase === 'LOADING_PREVIEW' && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Spinner />
              Carregando impacto da revogação…
            </div>
          )}

          {/* Não há precedente para a chave */}
          {phase === 'CONFIRM' && preview && !preview.found && (
            <div className="flex items-start gap-3 bg-muted border border-border rounded-lg p-3">
              <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="text-sm text-foreground">
                <p className="font-medium text-foreground">Nenhum precedente encontrado</p>
                <p className="text-muted-foreground mt-1">
                  Não há precedente integrado para esta combinação de emitente e NCM.
                  Nada a revogar.
                </p>
              </div>
            </div>
          )}

          {/* Já revogado */}
          {phase === 'CONFIRM' && preview?.found && preview.ja_revogado && (
            <div className="flex items-start gap-3 bg-info-subtle border border-info-border rounded-lg p-3">
              <Info className="w-5 h-5 text-info-text mt-0.5" />
              <div className="text-sm text-foreground">
                <p className="font-medium text-info-text">Este precedente já está revogado</p>
                <p className="text-muted-foreground mt-1">
                  Ele não está mais sendo usado pelo motor. Não é possível revogá-lo de novo.
                </p>
              </div>
            </div>
          )}

          {/* Preview de impacto + motivo (precedente ativo) */}
          {(phase === 'CONFIRM' || phase === 'REVOKING') && canRevoke && (
            <>
              <div className="bg-warning-subtle border border-warning-border rounded-lg p-3 text-sm text-foreground">
                {preview.linhas_vigentes > 1 && (
                  <p className="mb-1">
                    <strong>{preview.linhas_vigentes.toLocaleString('pt-BR')} precedentes</strong> vigentes
                    nesta chave, um por CFOP do emitente — todos serão revogados.
                  </p>
                )}
                {preview.affected_invoices > 0 ? (
                  <p>
                    Isto revoga o precedente e{' '}
                    <strong>
                      reenfileira {preview.affected_invoices.toLocaleString('pt-BR')} nota(s) /{' '}
                      {preview.affected_items.toLocaleString('pt-BR')} item(ns)
                    </strong>{' '}
                    para reprocesso — <strong>sem publicar no Onvio</strong>.
                  </p>
                ) : (
                  <p>
                    Isto revoga o precedente. <strong>Nenhuma nota será reprocessada</strong>{' '}
                    (nenhuma nota usa este precedente no momento).
                  </p>
                )}
              </div>

              {phase === 'CONFIRM' && (
                <div>
                  <Label htmlFor="revoke-motivo" className="block text-xs mb-1.5">
                    Por que revogar? (fica registrado na auditoria)
                  </Label>
                  <Textarea
                    id="revoke-motivo"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    rows={3}
                    placeholder="Ex.: precedente contaminado por classificação incorreta na origem."
                    aria-required="true"
                    className="resize-none"
                  />
                  {motivoEmpty && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Informe um motivo para habilitar a revogação.
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {phase === 'REVOKING' && (
            <div className="flex items-center gap-3 text-sm text-foreground bg-warning-subtle border border-warning-border rounded-lg p-3">
              <Spinner className="text-warning-text" />
              Revogando e enfileirando reprocesso… <strong>não feche</strong>.
            </div>
          )}

          {phase === 'DONE' && result && (
            <div className="flex items-start gap-3 bg-success-subtle border border-success-border rounded-lg p-3">
              <CheckCircle2 className="w-5 h-5 text-success-text mt-0.5" />
              <div className="text-sm text-foreground">
                <p className="font-medium text-success-text">
                  {result.linhas_revogadas > 1
                    ? `${result.linhas_revogadas.toLocaleString('pt-BR')} precedentes revogados (um por CFOP).`
                    : 'Precedente revogado.'}
                </p>
                <p className="text-muted-foreground mt-1">
                  <strong>{(result.reprocessed_invoices || 0).toLocaleString('pt-BR')}</strong>{' '}
                  nota(s) /{' '}
                  <strong>{(result.reprocessed_items || 0).toLocaleString('pt-BR')}</strong>{' '}
                  item(ns) reenfileirado(s) para reprocesso (sem publicar no Onvio).
                </p>
                {result.revogado_por && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    Revogado por {result.revogado_por}
                  </p>
                )}
              </div>
            </div>
          )}

          {phase === 'FAILED' && (
            <div className="flex items-start gap-3 bg-destructive-subtle border border-destructive-border rounded-lg p-3">
              <AlertTriangle className="w-5 h-5 text-destructive-text mt-0.5" />
              <div className="text-sm text-foreground">
                <p className="font-medium text-destructive-text">Erro</p>
                <p className="text-muted-foreground mt-1">{errorMsg}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-3 border-t border-border bg-muted">
          {phase === 'CONFIRM' && canRevoke && (
            <>
              <Button
                onClick={onClose}
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => revokeMutation.mutate()}
                disabled={motivoEmpty}
                variant="warning"
              >
                <RotateCcw className="w-4 h-4" /> Revogar precedente
              </Button>
            </>
          )}
          {/* Sem precedente / já revogado: só fechar */}
          {phase === 'CONFIRM' && !canRevoke && (
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
            >
              Fechar
            </Button>
          )}
          {phase === 'DONE' && (
            <Button
              onClick={() => onRevoked?.()}
              variant="default"
            >
              Fechar
            </Button>
          )}
          {phase === 'FAILED' && (
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
            >
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Extrai uma mensagem legível dos erros do client (`API <status>: <body>`).
// Trata 422 (motivo) e 404 (sem precedente) com texto amigável.
export function parseError(err) {
  const raw = err?.message || 'Erro na revogação'
  const m = raw.match(/^API (\d{3}): (.*)$/s)
  if (!m) return raw
  const status = m[1]
  let detail = m[2]
  try {
    const parsed = JSON.parse(detail)
    if (parsed?.detail) detail = parsed.detail
  } catch {
    /* corpo não-JSON: usa como veio */
  }
  if (status === '404') {
    return detail || 'Nenhum precedente encontrado para esta chave.'
  }
  if (status === '422') {
    return detail || 'Motivo é obrigatório.'
  }
  return detail || raw
}
