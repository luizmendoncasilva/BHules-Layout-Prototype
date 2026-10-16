// frontend/src/components/precedentes/RevokeNfsePrecedenteModal.jsx
import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { RotateCcw, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { api } from '../../api/client'
import { useAuth } from '../../auth/useAuth'
import { formatCnpj } from '../../utils/cnpj'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button, Textarea, Label, Spinner,
} from '@bhubai/bhub-design-system'

/**
 * Modal de revogação LÓGICA de um precedente NFS-e v2 (Fase 3).
 *
 * Espelha `RevokePrecedenteModal.jsx` (NF-e), adaptado para os proxies
 * NFS-e que operam por `precedente_id` (não por chave natural
 * emitente+NCM): `GET /nfse/precedentes/{id}/revogar-preview` e
 * `POST /nfse/precedentes/{id}/revogar`.
 *
 * Estados: LOADING_PREVIEW → CONFIRM → REVOKING → DONE | FAILED.
 *
 * A revogação NÃO apaga nada: marca o precedente como revogado e reenfileira
 * (raio, zero-publish) as notas que o usaram. Por ser reversível, a fricção
 * certa é exigir um motivo (auditado) — não um word-gate "digite REVOGAR".
 *
 * Props:
 * - `target`: { precedenteId, prestadorCnpj, codigoServico } (null = fechado).
 * - `onClose`: chamado em cancelar/fechar (sem efeito no parent).
 * - `onRevoked`: chamado após sucesso (parent deve refetch a lista/análise).
 */
export default function RevokeNfsePrecedenteModal({ target, onClose, onRevoked }) {
  const [phase, setPhase] = useState('LOADING_PREVIEW')
  const [preview, setPreview] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [motivo, setMotivo] = useState('')
  const [result, setResult] = useState(null)

  const { user } = useAuth()
  const queryClient = useQueryClient()

  const precedenteId = target?.precedenteId
  const prestadorCnpj = target?.prestadorCnpj
  const codigoServico = target?.codigoServico

  // Carrega o preview (não-mutante) ao abrir numa nova chave de precedente.
  useEffect(() => {
    if (!target) return
    setPhase('LOADING_PREVIEW')
    setPreview(null)
    setErrorMsg('')
    setMotivo('')
    setResult(null)

    let cancelled = false
    api.nfsePrecedenteRevogarPreview(precedenteId)
      .then((data) => { if (!cancelled) { setPreview(data); setPhase('CONFIRM') } })
      .catch((err) => {
        if (!cancelled) {
          setErrorMsg(parseError(err))
          setPhase('FAILED')
        }
      })
    return () => { cancelled = true }
  }, [target, precedenteId])

  const revokeMutation = useMutation({
    mutationFn: () =>
      api.nfsePrecedenteRevogar(precedenteId, {
        motivo: motivo.trim(),
        autor: user?.email || 'desconhecido',
      }),
    onMutate: () => { setPhase('REVOKING'); setErrorMsg('') },
    onSuccess: (data) => {
      setResult(data)
      setPhase('DONE')
      // Reprocesso (raio) foi enfileirado: invoices/análise ficam desatualizadas.
      queryClient.invalidateQueries({ queryKey: ['nfsePrecedentes'] })
      queryClient.invalidateQueries({ queryKey: ['nfseAnalysis'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['statusCounts'] })
    },
    onError: (err) => {
      setErrorMsg(parseError(err))
      setPhase('FAILED')
    },
  })

  // Autofocus no motivo quando entra na fase CONFIRM (só há precedente p/ revogar).
  const canRevoke = preview?.vigente && !preview?.ja_revogado
  useEffect(() => {
    if (phase === 'CONFIRM' && canRevoke) {
      const id = setTimeout(() => document.getElementById('revoke-nfse-motivo')?.focus(), 0)
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
                Revogar Precedente NFS-e
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
                ID: <span className="font-mono text-foreground">#{precedenteId}</span>
              </span>
              {prestadorCnpj && (
                <span className="text-foreground">
                  Prestador: <span className="font-mono text-foreground">{formatCnpj(prestadorCnpj)}</span>
                </span>
              )}
              {codigoServico && (
                <span className="text-foreground">
                  Código LC 116: <span className="font-mono text-foreground">{codigoServico}</span>
                </span>
              )}
            </div>
          </div>

          {phase === 'LOADING_PREVIEW' && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Spinner />
              Carregando impacto da revogação…
            </div>
          )}

          {/* Já revogado */}
          {phase === 'CONFIRM' && preview && preview.ja_revogado && (
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

          {/* Substituído (não vigente, não revogado explicitamente) */}
          {phase === 'CONFIRM' && preview && !preview.vigente && !preview.ja_revogado && (
            <div className="flex items-start gap-3 bg-muted border border-border rounded-lg p-3">
              <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="text-sm text-foreground">
                <p className="font-medium text-foreground">Precedente não está vigente</p>
                <p className="text-muted-foreground mt-1">
                  Este precedente já foi substituído por outro. Nada a revogar.
                </p>
              </div>
            </div>
          )}

          {/* Preview de impacto + motivo (precedente vigente) */}
          {(phase === 'CONFIRM' || phase === 'REVOKING') && canRevoke && (
            <>
              <div className="bg-warning-subtle border border-warning-border rounded-lg p-3 text-sm text-foreground">
                {preview.affected_invoices > 0 ? (
                  <p>
                    Isto revoga o precedente e{' '}
                    <strong>
                      reenfileira {preview.affected_invoices.toLocaleString('pt-BR')} nota(s)
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
                  <Label htmlFor="revoke-nfse-motivo" className="block text-xs mb-1.5">
                    Por que revogar? (fica registrado na auditoria)
                  </Label>
                  <Textarea
                    id="revoke-nfse-motivo"
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
                <p className="font-medium text-success-text">Precedente revogado.</p>
                <p className="text-muted-foreground mt-1">
                  <strong>{(result.raio?.enfileiradas || 0).toLocaleString('pt-BR')}</strong>{' '}
                  de <strong>{(result.raio?.total || 0).toLocaleString('pt-BR')}</strong>{' '}
                  nota(s) reenfileirada(s) para reprocesso (sem publicar no Onvio).
                </p>
                {result.raio?.erro && (
                  <p className="text-warning-text mt-1 text-xs">
                    Revogação persistida, mas o enfileiramento do raio falhou: {result.raio.erro}
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
          {/* Já revogado / não vigente: só fechar */}
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
// Trata 422 (motivo/autor) e 404/409 (precedente) com texto amigável.
function parseError(err) {
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
    return detail || 'Precedente não encontrado.'
  }
  if (status === '409') {
    return detail || 'Precedente já revogado ou substituído.'
  }
  if (status === '422') {
    return detail || 'Motivo é obrigatório.'
  }
  return detail || raw
}
