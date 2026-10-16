// frontend/src/components/precedentes/RevokePrecedentesNotasModal.jsx
import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { RotateCcw, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { api } from '../../api/client'
import { formatCnpj } from '../../utils/cnpj'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button, Textarea, Label, Spinner,
} from '@bhubai/bhub-design-system'
import { parseError } from './RevokePrecedenteModal'

const CHAVES_VISIVEIS = 8

/**
 * Revogação de precedentes POR NOTA e EM LOTE (PREC-02, Célula 10/09).
 *
 * Irmão do `RevokePrecedenteModal` (uma chave): o motor resolve as chaves que as
 * notas usaram, revoga todas e reenfileira o reprocesso (sem publicar no Onvio).
 * Mesma máquina de estados: LOADING_PREVIEW → CONFIRM → REVOKING → DONE | FAILED.
 *
 * Dois trilhos de aprendizado (precedente-quatro-chaves, PQC-08): além dos
 * precedentes integrados, o lote inativa os tratamentos auditados por analista
 * que os itens usaram. O preview mostra o raio de cada trilho e o total unido,
 * e as notas já enviadas (integradas ao Domínio ou publicadas ao Onvio), que
 * não são reprocessadas — a correção não republica.
 *
 * Props:
 * - `invoiceIds`: ids das notas (null ou vazio = modal fechado).
 * - `onClose`: cancelar/fechar.
 * - `onRevoked`: chamado ao fechar depois do sucesso.
 */
export default function RevokePrecedentesNotasModal({ invoiceIds, onClose, onRevoked }) {
  const [phase, setPhase] = useState('LOADING_PREVIEW')
  const [preview, setPreview] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [motivo, setMotivo] = useState('')
  const [result, setResult] = useState(null)

  const queryClient = useQueryClient()

  const aberto = Array.isArray(invoiceIds) && invoiceIds.length > 0
  const idsKey = aberto ? invoiceIds.join(',') : ''

  useEffect(() => {
    if (!aberto) return
    setPhase('LOADING_PREVIEW')
    setPreview(null)
    setErrorMsg('')
    setMotivo('')
    setResult(null)

    let cancelled = false
    api.getRevokePrecedentesPorNotasPreview(invoiceIds)
      .then((data) => { if (!cancelled) { setPreview(data); setPhase('CONFIRM') } })
      .catch((err) => {
        if (!cancelled) {
          setErrorMsg(parseError(err))
          setPhase('FAILED')
        }
      })
    return () => { cancelled = true }
    // idsKey representa invoiceIds: um array novo com os mesmos ids não recarrega.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, idsKey])

  const revokeMutation = useMutation({
    mutationFn: () => api.revogarPrecedentesPorNotas(invoiceIds, motivo.trim()),
    onMutate: () => { setPhase('REVOKING'); setErrorMsg('') },
    onSuccess: (data) => {
      setResult(data)
      setPhase('DONE')
      // Reprocesso enfileirado: nota, escrituração, NFS-e e histórico ficam velhos.
      for (const key of ['invoices', 'invoice', 'escrituracao', 'statusCounts',
        'nfseAnalysis', 'nfsePrecedentes', 'invoiceAuditEvents']) {
        queryClient.invalidateQueries({ queryKey: [key] })
      }
    },
    onError: (err) => {
      setErrorMsg(parseError(err))
      setPhase('FAILED')
    },
  })

  const chavesNfe = preview?.chaves?.nfe || []
  const precedentesNfse = preview?.chaves?.nfse || []
  const tratamentos = preview?.chaves?.auditado || []
  const totalChaves = chavesNfe.length + precedentesNfse.length + tratamentos.length
  const canRevoke = totalChaves > 0
  const uniaoNfe = preview?.raio_total_unido || 0
  const raioNfse = preview?.raio_nfse || 0
  const totalReprocesso = preview
    ? uniaoNfe + raioNfse
    : (preview?.reprocesso || []).reduce((acc, g) => acc + g.total, 0)
  const raioPrecedente = preview?.raio_precedente || 0
  const raioAuditado = preview?.raio_auditado || 0
  const notasEnviadas = (preview?.notas_enviadas || []).length

  useEffect(() => {
    if (phase === 'CONFIRM' && canRevoke) {
      const id = setTimeout(() => document.getElementById('revoke-notas-motivo')?.focus(), 0)
      return () => clearTimeout(id)
    }
  }, [phase, canRevoke])

  if (!aberto) return null

  const motivoEmpty = !motivo.trim()
  const titulo = invoiceIds.length === 1
    ? 'Revogar precedentes da nota'
    : `Revogar precedentes de ${invoiceIds.length.toLocaleString('pt-BR')} notas`

  const reenfileiradas = (result?.jobs || [])
    .filter((j) => j.enviado)
    .reduce((acc, j) => acc + j.invoice_ids.length, 0)
  const jobsFalhos = (result?.jobs || []).filter((j) => !j.enviado).length
  const ignoradas = [
    ...(result?.ignoradas?.nfe || []),
    ...(result?.ignoradas?.nfse || []),
    ...(result?.ignoradas?.auditado || []),
  ]
  const jaRevogadas = ignoradas.filter((i) => i.motivo === 'ja_revogado' || i.motivo === 'ja_inativo').length
  const naoEncontradas = ignoradas.filter((i) => i.motivo === 'nao_encontrado').length
  const tratamentosInativados = (result?.tratamentos_inativados || []).length

  const busy = phase === 'REVOKING'

  return (
    <Dialog open={aberto} onOpenChange={(o) => { if (!o && !busy) onClose?.() }}>
      <DialogContent
        showCloseButton={!busy}
        className="sm:max-w-[560px] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border text-left">
          <div className="flex items-center gap-3 pr-6">
            <div className="w-9 h-9 rounded-lg bg-warning-subtle flex items-center justify-center">
              <RotateCcw className="w-4 h-4 text-warning-text" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">{titulo}</DialogTitle>
              <DialogDescription className="text-xs">Reversível — fica registrado no histórico de cada nota.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {phase === 'LOADING_PREVIEW' && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Spinner />
              Buscando os precedentes que estas notas usaram…
            </div>
          )}

          {(phase === 'CONFIRM' || phase === 'REVOKING') && canRevoke && (
            <>
              <div className="bg-warning-subtle border border-warning-border rounded-lg p-3 text-sm text-foreground">
                <p>
                  Isto{' '}
                  {[
                    chavesNfe.length > 0 && `revoga ${chavesNfe.length.toLocaleString('pt-BR')} precedente(s) de NF-e`,
                    precedentesNfse.length > 0 && `revoga ${precedentesNfse.length.toLocaleString('pt-BR')} precedente(s) de NFS-e`,
                    tratamentos.length > 0 && `inativa ${tratamentos.length.toLocaleString('pt-BR')} tratamento(s) auditado(s) por analista`,
                  ].filter(Boolean).map((frase, i, arr) => (
                    <span key={frase}>
                      <strong>{frase}</strong>
                      {i < arr.length - 2 ? ', ' : i === arr.length - 2 ? ' e ' : ''}
                    </span>
                  ))}
                  {' '}usados por estas notas
                  {totalReprocesso > 0 ? (
                    <>
                      {' '}e <strong>reenfileira {totalReprocesso.toLocaleString('pt-BR')} nota(s)</strong>{' '}
                      para reprocesso — <strong>sem publicar no Onvio</strong>.
                    </>
                  ) : (
                    <>. <strong>Nenhuma nota será reprocessada.</strong></>
                  )}
                </p>
                {(raioPrecedente > 0 || raioAuditado > 0) && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Raio por trilho: <strong>{raioPrecedente.toLocaleString('pt-BR')}</strong> nota(s) pelo
                    precedente integrado · <strong>{raioAuditado.toLocaleString('pt-BR')}</strong> nota(s) pelo
                    tratamento auditado · <strong>{uniaoNfe.toLocaleString('pt-BR')}</strong> no total
                    (uma nota nos dois raios conta uma vez)
                    {raioNfse > 0 && (
                      <> · <strong>{raioNfse.toLocaleString('pt-BR')}</strong> nota(s) de NFS-e</>
                    )}
                    .
                  </p>
                )}
              </div>

              {chavesNfe.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Precedentes de NF-e</p>
                  <ul className="text-sm text-foreground space-y-0.5">
                    {chavesNfe.slice(0, CHAVES_VISIVEIS).map(([companyId, emitente, ncm, cfop]) => (
                      <li key={`${companyId}-${emitente}-${ncm}-${cfop || 'todas'}`}>
                        NCM <span className="font-mono text-foreground">{ncm}</span>
                        {' · '}emitente <span className="font-mono text-foreground">{formatCnpj(emitente)}</span>
                        {' · '}CFOP{' '}
                        <span className="font-mono text-foreground">{cfop || 'todas (um precedente por CFOP)'}</span>
                      </li>
                    ))}
                  </ul>
                  {chavesNfe.length > CHAVES_VISIVEIS && (
                    <p className="text-xs text-muted-foreground">
                      + {(chavesNfe.length - CHAVES_VISIVEIS).toLocaleString('pt-BR')} outro(s)
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {phase === 'CONFIRM' && !canRevoke && (
            <div className="flex items-start gap-3 bg-muted border border-border rounded-lg p-3">
              <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="text-sm text-foreground">
                <p className="font-medium text-foreground">Nenhum precedente em uso nestas notas</p>
                <p className="text-muted-foreground mt-1">Nada a revogar por aqui.</p>
              </div>
            </div>
          )}

          {/* Trilho 2: tratamentos auditados por analista que o lote inativa (PQC-08) */}
          {(phase === 'CONFIRM' || phase === 'REVOKING') && tratamentos.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Tratamentos auditados por analista
              </p>
              <ul className="text-sm text-foreground space-y-0.5">
                {tratamentos.slice(0, CHAVES_VISIVEIS).map((t) => (
                  <li key={`${t.company_id}-${t.emitente_cnpj}-${t.cfop_emitente}-${t.ncm}-${t.uf_origem}-${t.uf_destino}-${t.finalidade}`}>
                    NCM <span className="font-mono text-foreground">{t.ncm}</span>
                    {' · '}emitente <span className="font-mono text-foreground">{formatCnpj(t.emitente_cnpj)}</span>
                    {' · '}CFOP <span className="font-mono text-foreground">{t.cfop_emitente || '—'}</span>
                    {' · '}{t.uf_origem}→{t.uf_destino} · {t.finalidade}
                  </li>
                ))}
              </ul>
              {tratamentos.length > CHAVES_VISIVEIS && (
                <p className="text-xs text-muted-foreground">
                  + {(tratamentos.length - CHAVES_VISIVEIS).toLocaleString('pt-BR')} outro(s)
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Ficam inativos (com motivo e autor). A próxima nota do mesmo fornecedor, CFOP e NCM
                volta a ser classificada pelo motor, sem esse aprendizado.
              </p>
            </div>
          )}

          {(phase === 'CONFIRM' || phase === 'REVOKING') && canRevoke && notasEnviadas > 0 && (
            <div className="flex items-start gap-3 bg-info-subtle border border-info-border rounded-lg p-3">
              <Info className="w-5 h-5 text-info-text mt-0.5 shrink-0" />
              <p className="text-sm text-foreground">
                <strong>{notasEnviadas.toLocaleString('pt-BR')} nota(s) já enviada(s)</strong> (integrada ao
                Domínio ou publicada ao Onvio): o aprendizado é revogado, mas essas notas não são
                reprocessadas — a correção não republica.
              </p>
            </div>
          )}

          {phase === 'CONFIRM' && canRevoke && (
            <div>
              <Label htmlFor="revoke-notas-motivo" className="block text-xs mb-1.5">
                Por que revogar? (fica registrado no histórico de cada nota)
              </Label>
              <Textarea
                id="revoke-notas-motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
                placeholder="Ex.: CFOP 6101 de lente classificado como 2124 — o correto na revenda é 2102."
                aria-required="true"
                className="resize-none"
              />
              {motivoEmpty && (
                <p className="text-xs text-muted-foreground mt-1">Informe um motivo para habilitar a revogação.</p>
              )}
            </div>
          )}

          {phase === 'REVOKING' && (
            <div className="flex items-center gap-3 text-sm text-foreground bg-warning-subtle border border-warning-border rounded-lg p-3">
              <Spinner className="text-warning-text" />
              Revogando e enfileirando reprocesso… <strong>não feche</strong>.
            </div>
          )}

          {phase === 'DONE' && result && (
            <div className="flex items-start gap-3 bg-success-subtle border border-success-border rounded-lg p-3">
              <CheckCircle2 className="w-5 h-5 text-success-text mt-0.5 shrink-0" />
              <div className="text-sm text-foreground space-y-1">
                <p className="font-medium text-success-text">
                  {(result.revogadas.nfe.length + result.revogadas.nfse.length).toLocaleString('pt-BR')}{' '}
                  precedente(s) revogado(s)
                  {tratamentosInativados > 0 && (
                    <> e {tratamentosInativados.toLocaleString('pt-BR')} tratamento(s) auditado(s) inativado(s)</>
                  )}.
                </p>
                <p className="text-muted-foreground">
                  <strong>{reenfileiradas.toLocaleString('pt-BR')}</strong> nota(s) reenfileirada(s) para
                  reprocesso (sem publicar no Onvio).
                </p>
                {jaRevogadas > 0 && (
                  <p className="text-muted-foreground text-xs">
                    {jaRevogadas.toLocaleString('pt-BR')} já estava(m) revogado(s) — nada mudou nesses.
                  </p>
                )}
                {naoEncontradas > 0 && (
                  <p className="text-warning-text text-xs">
                    {naoEncontradas.toLocaleString('pt-BR')} não encontrado(s) — não foi inativado.
                    Tratamento legado sem emitente ou CFOP não entra neste lote.
                  </p>
                )}
                {result.revogado_por && (
                  <p className="text-muted-foreground text-xs">Revogado por {result.revogado_por}</p>
                )}
              </div>
            </div>
          )}

          {phase === 'DONE' && jobsFalhos > 0 && (
            <div className="flex items-start gap-3 bg-warning-subtle border border-warning-border rounded-lg p-3">
              <AlertTriangle className="w-5 h-5 text-warning-text mt-0.5 shrink-0" />
              <p className="text-sm text-foreground">
                A revogação foi gravada, mas o reprocesso não foi enfileirado para{' '}
                <strong>{jobsFalhos} lote(s)</strong>. Essas notas continuam com a classificação antiga até
                serem analisadas de novo — avise o time de dev.
              </p>
            </div>
          )}

          {phase === 'FAILED' && (
            <div className="flex items-start gap-3 bg-destructive-subtle border border-destructive-border rounded-lg p-3">
              <AlertTriangle className="w-5 h-5 text-destructive-text mt-0.5 shrink-0" />
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
              <Button onClick={onClose} variant="ghost" className="text-muted-foreground hover:text-foreground">
                Cancelar
              </Button>
              <Button
                onClick={() => revokeMutation.mutate()}
                disabled={motivoEmpty}
                variant="warning"
              >
                <RotateCcw className="w-4 h-4" /> Revogar precedentes
              </Button>
            </>
          )}
          {((phase === 'CONFIRM' && !canRevoke) || phase === 'FAILED') && (
            <Button onClick={onClose} variant="ghost" className="text-muted-foreground hover:text-foreground">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
