import { useState } from 'react'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { ChevronLeft, Check, Pencil, Loader2, X, Save, Undo2, Download } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
  Button, IconButton, Tabs, TabsList, TabsTrigger, Badge,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue, SelectGroup, SelectLabel,
} from '@bhubai/bhub-design-system'
import { useInvoiceItems, useStatusReasons, useInvoiceDetail } from '../../hooks/useInvoices'
import { useNfseAnalysis } from '../../hooks/useNfseValidation'
import { useEscrituracao, useRunEscrituracao } from '../../hooks/useEscrituracao'
import { api } from '../../api/client'
import { useUndoEscrituracao } from '../../hooks/useInvoices'
import { useCompanies } from '../../hooks/useCompanies'
import StatusReasons from './StatusReasons'
import DanfeTab from './DanfeTab'
import DanfseTab from './DanfseTab'
import NfseRetentionTab from './NfseRetentionTab'
import NfseReinfCrossTab from './NfseReinfCrossTab'
import EscrituracaoTab from '../escrituracao/EscrituracaoTab'
import AuditTab from './AuditTab'
import { CST_ICMS, CSOSN } from '../../constants/classificationOptions'
import { useToast } from '../shared/Toast'

// Sentinel values for the empty ("—"/"--") option in Radix Select — Radix
// disallows an empty-string SelectItem value.
const FINALIDADE_ALL_VALUE = '__none__'
const CST_ALL_VALUE = '__none__'

function formatCurrency(val) {
  if (val == null) return '-'
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function CorrectionModal({ sugestoes, onClose, onSubmit, submitting }) {
  // Only show items with divergences
  const divergentItems = (sugestoes || []).filter(s => s.divergencias?.length > 0)

  // State: corrections per item { [invoice_item_id]: { finalidade, cfop_entrada, cst_icms } }
  const [corrections, setCorrections] = useState(() => {
    const init = {}
    for (const s of divergentItems) {
      init[s.invoice_item_id] = {
        finalidade: s.finalidade || '',
        cfop_entrada: s.cfop_entrada || '',
        cst_icms: s.cst_icms_entrada || '',
      }
    }
    return init
  })

  const updateField = (itemId, field, value) => {
    setCorrections(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }))
  }

  const handleSubmit = () => {
    const feedbacks = divergentItems.map(s => {
      const c = corrections[s.invoice_item_id]
      const correcoes = {}
      if (c.finalidade !== (s.finalidade || '')) correcoes.finalidade = c.finalidade
      if (c.cfop_entrada !== (s.cfop_entrada || '')) correcoes.cfop_entrada = c.cfop_entrada
      if (c.cst_icms !== (s.cst_icms_entrada || '')) correcoes.cst_icms = c.cst_icms

      return {
        invoice_item_id: s.invoice_item_id,
        motor_acertou: Object.keys(correcoes).length === 0,
        correcoes: Object.keys(correcoes).length > 0 ? correcoes : undefined,
      }
    })
    onSubmit(feedbacks)
  }

  const handleOpenChange = (open) => {
    if (!open && !submitting) onClose()
  }

  if (divergentItems.length === 0) {
    return (
      <Sheet open onOpenChange={handleOpenChange}>
        <SheetContent side="right" className="sm:max-w-lg p-0 gap-0 flex flex-col" showCloseButton={false}>
          <SheetHeader className="flex-row items-center justify-between border-b border-border space-y-0 px-6 py-4">
            <SheetTitle>Corrigir Escrituracao</SheetTitle>
            <IconButton aria-label="Fechar" variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </IconButton>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6">
            <p className="text-sm text-muted-foreground">Nenhum item com divergencia encontrado.</p>
          </div>
          <SheetFooter className="border-t border-border px-6 py-4">
            <Button variant="secondary" onClick={onClose}>Fechar</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Sheet open onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-2xl p-0 gap-0 flex flex-col relative"
        showCloseButton={false}
        onPointerDownOutside={(e) => { if (submitting) e.preventDefault() }}
        onEscapeKeyDown={(e) => { if (submitting) e.preventDefault() }}
      >
        {/* Full-screen loading overlay */}
        {submitting && (
          <div className="absolute inset-0 bg-card/80 z-10 flex flex-col items-center justify-center rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3" />
            <p className="text-sm text-muted-foreground font-medium">Enviando correções...</p>
            <p className="text-xs text-muted-foreground mt-1">Aguarde, o motor está reprocessando a nota.</p>
          </div>
        )}
        {/* Header */}
        <SheetHeader className="flex-row items-center justify-between border-b border-border space-y-0 px-6 py-4">
          <SheetTitle>Corrigir Escrituracao ({divergentItems.length} itens)</SheetTitle>
          <IconButton aria-label="Fechar" variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
            <X className="w-5 h-5" />
          </IconButton>
        </SheetHeader>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {divergentItems.map(s => (
            <div key={s.invoice_item_id} className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-sm font-semibold text-foreground">{s.descricao || `Item #${s.invoice_item_id}`}</span>
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    {s.ncm && <span>NCM: <strong className="text-foreground">{s.ncm}</strong></span>}
                    {s.valor_item != null && <span>Valor: <strong className="text-foreground">{Number(s.valor_item).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></span>}
                    {s.cfop_emitente && <span>CFOP Emit: <strong className="text-foreground">{s.cfop_emitente}</strong></span>}
                  </div>
                </div>
                <span className="text-xs text-destructive-text font-medium">{s.divergencias.length} divergencia(s)</span>
              </div>

              {/* Show divergences */}
              <div className="mb-3 space-y-1">
                {s.divergencias.map((d, i) => (
                  <div key={i} className="text-xs bg-destructive-subtle text-destructive-text px-2 py-1 rounded">
                    <strong>{d.campo}</strong>: emitente={d.valor_emitente || '—'} / sugerido={d.valor_sugerido || '—'}
                    {d.descricao && <span className="text-destructive-text ml-1">({d.descricao})</span>}
                  </div>
                ))}
              </div>

              {/* Editable fields */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Finalidade</label>
                  <Select
                    value={corrections[s.invoice_item_id]?.finalidade || FINALIDADE_ALL_VALUE}
                    onValueChange={v => updateField(s.invoice_item_id, 'finalidade', v === FINALIDADE_ALL_VALUE ? '' : v)}
                  >
                    <SelectTrigger className="w-full h-auto py-1.5 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={FINALIDADE_ALL_VALUE}>—</SelectItem>
                      {['REVENDA', 'MATERIA_PRIMA', 'USO_CONSUMO', 'ATIVO_IMOBILIZADO', 'SERVICO', 'IMPORTACAO', 'DEVOLUCAO', 'RETORNO', 'BONIFICACAO', 'TRANSFERENCIA'].map(f => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">CFOP Entrada</label>
                  <input
                    type="text"
                    value={corrections[s.invoice_item_id]?.cfop_entrada || ''}
                    onChange={e => updateField(s.invoice_item_id, 'cfop_entrada', e.target.value)}
                    className="w-full border border-border rounded px-2 py-1.5 text-sm font-mono"
                    placeholder="ex: 1102"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">CST/CSOSN ICMS</label>
                  <Select
                    value={corrections[s.invoice_item_id]?.cst_icms || CST_ALL_VALUE}
                    onValueChange={v => updateField(s.invoice_item_id, 'cst_icms', v === CST_ALL_VALUE ? '' : v)}
                  >
                    <SelectTrigger className="w-full h-auto py-1.5 text-sm font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CST_ALL_VALUE}>--</SelectItem>
                      <SelectGroup>
                        <SelectLabel>CST ICMS</SelectLabel>
                        {CST_ICMS.map(o => (
                          <SelectItem key={`cst-${o.code}`} value={o.code}>{o.code} - {o.description}</SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>CSOSN (Simples Nacional)</SelectLabel>
                        {CSOSN.map(o => (
                          <SelectItem key={`csosn-${o.code}`} value={o.code}>{o.code} - {o.description}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <SheetFooter className="flex-row items-center justify-end gap-3 border-t border-border px-6 py-4">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Correcoes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default function DetailView({ invoice, onBack }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const isNfse = invoice?.cod_mod === 'NFSE' || (invoice?.chave_nfe || '').startsWith('NFSE-')
  const [activeTab, setActiveTab] = useState(isNfse ? 'retencoes' : 'escrituracao')
  const { data: items, isLoading: itemsLoading } = useInvoiceItems(invoice?.id)
  const { data: statusReasons } = useStatusReasons(invoice?.status_analise ? invoice?.id : null)
  const { data: nfseAnalysis } = useNfseAnalysis(isNfse ? invoice?.id : null)
  const runEscrituracao = useRunEscrituracao()
  const { data: persistedEscrituracao, isLoading: escrituracaoLoading, error: escrituracaoError } = useEscrituracao(
    !isNfse && activeTab === 'escrituracao' ? invoice?.id : null
  )
  const [escrituracaoData, setEscrituracaoData] = useState(null)
  const { data: companies = [] } = useCompanies()
  const company = companies.find(c => c.id === invoice?.company_id) || null
  const { data: invoiceDetail } = useInvoiceDetail(invoice?.id)
  const emitter = invoiceDetail?.emitter || null

  // Lista enxuta de companies não traz cnaes_detalhes — busca sob demanda.
  const { data: companyFull } = useQuery({
    queryKey: ['company', invoice?.company_id],
    queryFn: () => api.getCompany(invoice.company_id),
    enabled: !!invoice?.company_id,
    staleTime: 5 * 60 * 1000,
  })

  const parseCnaes = (raw) => {
    if (!raw) return []
    try { return JSON.parse(raw) } catch { return [] }
  }
  const destCnaes = parseCnaes(companyFull?.cnaes_detalhes)
  const destCnaePrincipal = destCnaes.find(c => c.principal)
  const destCnaesSecundarios = destCnaes.filter(c => !c.principal)

  const emitCnaes = parseCnaes(emitter?.cnaes_detalhes)
  const emitCnaePrincipal = emitCnaes.find(c => c.principal)
  const emitCnaesSecundarios = emitCnaes.filter(c => !c.principal)
  const [feedbackMessage, setFeedbackMessage] = useState(null)
  const [confirmingAll, setConfirmingAll] = useState(false)
  const [feedbackDone, setFeedbackDone] = useState(false)
  const [showCorrectionModal, setShowCorrectionModal] = useState(false)
  const [submittingCorrections, setSubmittingCorrections] = useState(false)
  const undoMutation = useUndoEscrituracao()

  // Use persisted data when available
  const effectiveEscrituracaoData = escrituracaoData || persistedEscrituracao

  const handleUndoEscrituracao = () => {
    undoMutation.mutate([invoice.id], {
      onSuccess: () => {
        setEscrituracaoData(null)
        setFeedbackDone(false)
        setFeedbackMessage({ type: 'success', text: 'Escrituracao desfeita com sucesso.' })
        invalidateAfterFeedback()
        setTimeout(() => setFeedbackMessage(null), 5000)
      },
      onError: () => {
        setFeedbackMessage({ type: 'error', text: 'Erro ao desfazer escrituracao.' })
        setTimeout(() => setFeedbackMessage(null), 5000)
      },
    })
  }

  const invalidateAfterFeedback = () => {
    queryClient.invalidateQueries({ queryKey: ['invoices'] })
    queryClient.invalidateQueries({ queryKey: ['invoice', invoice.id] })
    queryClient.invalidateQueries({ queryKey: ['escrituracao', invoice.id] })
    queryClient.invalidateQueries({ queryKey: ['statusCounts'] })
  }

  const handleConfirmAll = async () => {
    if (!effectiveEscrituracaoData?.sugestoes?.length) return
    // Envio ao Onvio é definitivo (write-once): uma vez enviada, a nota fica
    // read-only no BHub — correções posteriores só direto no Onvio.
    const ok = window.confirm(
      'Ao confirmar, a nota vai pro Onvio e NÃO muda mais aqui — ajuste ' +
      'posterior só direto no Onvio.\n\n' +
      'O envio é definitivo. Confirme apenas com TODOS os itens revisados.\n\n' +
      'Deseja enviar ao Onvio agora?'
    )
    if (!ok) return
    setConfirmingAll(true)
    try {
      const feedbacks = effectiveEscrituracaoData.sugestoes.map(s => ({
        invoice_item_id: s.invoice_item_id,
        motor_acertou: true,
      }))
      // Única via que publica/envia ao Onvio (separada do save de feedback).
      await api.confirmarEnvioOnvio(invoice.id, feedbacks)
      setFeedbackDone(true)
      setFeedbackMessage({ type: 'success', text: 'Escrituracao confirmada com sucesso!' })
      invalidateAfterFeedback()
      setTimeout(() => setFeedbackMessage(null), 5000)
    } catch (e) {
      console.error('Confirm error:', e)
      setFeedbackMessage({ type: 'error', text: 'Erro ao confirmar escrituracao.' })
      setTimeout(() => setFeedbackMessage(null), 5000)
    } finally {
      setConfirmingAll(false)
    }
  }

  const handleSubmitCorrections = async (feedbacks) => {
    setSubmittingCorrections(true)
    try {
      await api.submitEscrituracaoFeedback(invoice.id, feedbacks)
      // Correção NÃO envia ao Onvio — a nota segue em conferência. Só o botão
      // "Confirmar e enviar ao Onvio" (handleConfirmAll) marca feedbackDone.
      setShowCorrectionModal(false)
      setFeedbackMessage({ type: 'success', text: 'Correcoes salvas. Motor re-processou a nota. Confirme e envie ao Onvio quando concluir a conferência.' })
      invalidateAfterFeedback()
      setTimeout(() => setFeedbackMessage(null), 5000)
    } catch (e) {
      console.error('Correction error:', e)
      setFeedbackMessage({ type: 'error', text: 'Erro ao enviar correcoes.' })
      setTimeout(() => setFeedbackMessage(null), 5000)
    } finally {
      setSubmittingCorrections(false)
    }
  }

  if (!invoice) return null

  const docLabel = isNfse ? 'NFS-e' : 'NF-e'
  const hasDivergences = effectiveEscrituracaoData?.sugestoes?.some(s => s.divergencias?.length > 0)
  // Itens pendentes = divergências acionáveis (CRITICO/ALERTA). INFORMATIVO é
  // by-design e não bloqueia. Trava de completude do envio: só libera o botão
  // "Confirmar e enviar" quando não há item pendente. (Backstop server-side em
  // /escrituracao/{id}/confirmar-envio via escrituracao_incompleta.)
  const hasItensPendentes = effectiveEscrituracaoData?.sugestoes?.some(
    s => s.divergencias?.some(d => d.severidade === 'CRITICO' || d.severidade === 'ALERTA')
  )

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <IconButton aria-label="Voltar" variant="ghost" onClick={onBack}>
            <ChevronLeft className="w-6 h-6" />
          </IconButton>
          <h1 className="text-lg font-semibold text-foreground">
            {docLabel} no {invoice.num_doc || invoice.id} - {invoice.emit_razao_social || 'Emitente'}
          </h1>
          {isNfse && <Badge variant="secondary">NFS-e</Badge>}
        </div>
        <div className="flex items-center gap-3">
          {invoice.chave_nfe && (
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const blob = await api.downloadInvoiceXml(invoice.id)
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `NFe_${invoice.chave_nfe}.xml`
                  document.body.appendChild(a)
                  a.click()
                  a.remove()
                  window.URL.revokeObjectURL(url)
                } catch (e) {
                  toast.error('Erro ao baixar XML', { description: e.message })
                }
              }}
            >
              <Download className="w-4 h-4" />
              XML
            </Button>
          )}
          {effectiveEscrituracaoData && !feedbackDone && invoice.escrituracao_status !== 'ESCRITURADA' && (
            <>
              {hasDivergences && (
                <Button
                  variant="warning"
                  onClick={() => setShowCorrectionModal(true)}
                >
                  <Pencil className="w-4 h-4" /> Corrigir
                </Button>
              )}
              <Button
                variant="success"
                onClick={handleConfirmAll}
                disabled={confirmingAll || hasItensPendentes}
                title={hasItensPendentes
                  ? 'Há itens pendentes (divergências CRÍTICO/ALERTA). Resolva-os com "Corrigir" antes de enviar ao Onvio.'
                  : 'Confirma e envia ao Onvio (definitivo)'}
              >
                {confirmingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Confirmar e enviar ao Onvio
              </Button>
            </>
          )}
          {(feedbackDone || invoice.escrituracao_status === 'ESCRITURADA') && (
            <>
              <Button
                variant="destructive"
                onClick={handleUndoEscrituracao}
                disabled={undoMutation.isPending}
              >
                {undoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Undo2 className="w-4 h-4" />}
                Desfazer
              </Button>
              <Badge variant="success" className="h-9 px-3 text-sm">
                <Check className="w-4 h-4" /> Escrituracao Confirmada
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Feedback toast */}
      {feedbackMessage && (
        <div className={`px-6 py-3 text-sm font-medium flex items-center gap-2 ${
          feedbackMessage.type === 'success'
            ? 'bg-success-subtle text-success-text border-b border-success-border'
            : 'bg-destructive-subtle text-destructive-text border-b border-destructive-border'
        }`}>
          {feedbackMessage.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {feedbackMessage.text}
          <IconButton aria-label="Fechar aviso" variant="ghost" size="sm" className="ml-auto" onClick={() => setFeedbackMessage(null)}>
            <X className="w-3.5 h-3.5" />
          </IconButton>
        </div>
      )}

      {/* Summary bar — Emitente + Destinatário */}
      <div className="bg-card border-b border-border px-6 py-2 space-y-1">
        <div className="flex gap-6 text-sm text-muted-foreground items-center">
          <span className="text-xs font-semibold text-muted-foreground uppercase w-20">{isNfse ? 'Prestador' : 'Emitente'}</span>
          <span><strong className="text-foreground">{invoice.emit_razao_social || invoice.emit_cnpj || '-'}</strong></span>
          <span>CNPJ: <strong className="text-foreground font-mono text-xs">{invoice.emit_cnpj || '-'}</strong></span>
          <span>UF: <strong className="text-foreground">{invoice.emit_uf || '-'}</strong></span>
          {invoice.ie_emitente && <span>IE: <strong className="text-foreground font-mono text-xs">{invoice.ie_emitente}</strong></span>}
          <span>Regime: <strong className={`${
            (invoice.crt === '1' || invoice.crt === 1) ? 'text-info-text' :
            (invoice.crt === '3' || invoice.crt === 3) ? 'text-foreground' :
            'text-muted-foreground'
          }`}>{
            invoice.crt === '1' || invoice.crt === 1 ? 'Simples Nacional' :
            invoice.crt === '2' || invoice.crt === 2 ? 'SN Excesso Sublimite' :
            invoice.crt === '3' || invoice.crt === 3 ? 'Regime Normal' :
            invoice.regime_prestador || 'Não informado'
          }</strong></span>
          {(emitCnaePrincipal || emitter?.cnae) && (
            <span
              title={
                emitCnaePrincipal?.description
                  ? `${emitCnaePrincipal.description}${
                      emitCnaesSecundarios.length
                        ? '\n\nSecundários:\n' + emitCnaesSecundarios.map(c => `${c.code} — ${c.description}`).join('\n')
                        : ''
                    }`
                  : emitter?.cnae_descricao || undefined
              }
            >
              CNAE: <strong className="text-foreground font-mono text-xs">{emitCnaePrincipal?.code || emitter.cnae}</strong>
              {(emitCnaePrincipal?.description || emitter?.cnae_descricao) && (
                <span className="text-muted-foreground ml-1">— {emitCnaePrincipal?.description || emitter.cnae_descricao}</span>
              )}
              {emitCnaesSecundarios.length > 0 && (
                <span className="text-muted-foreground ml-1">(+{emitCnaesSecundarios.length})</span>
              )}
            </span>
          )}
          {invoice.status_analise && (
            <Badge
              className="ml-auto rounded-full"
              variant={
                invoice.status_analise === 'CONFORME' ? 'success' :
                invoice.status_analise === 'REQUER_REVISAO' ? 'warning' :
                invoice.status_analise === 'BLOQUEADO' ? 'destructive' :
                'secondary'
              }
            >
              {invoice.status_analise}
            </Badge>
          )}
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground items-center">
          <span className="text-xs font-semibold text-muted-foreground uppercase w-20">Destinatario</span>
          <span><strong className="text-foreground">{company?.razao_social || company?.name || invoice.dest_cnpj || '-'}</strong></span>
          <span>CNPJ: <strong className="text-foreground font-mono text-xs">{invoice.dest_cnpj || '-'}</strong></span>
          <span>UF: <strong className="text-foreground">{invoice.dest_uf || '-'}</strong></span>
          {(invoice.ie_destinatario || company?.inscricao_estadual) && (
            <span>IE: <strong className="text-foreground font-mono text-xs">{invoice.ie_destinatario || company.inscricao_estadual}</strong></span>
          )}
          {company?.regime_tributario && (
            <span>Regime: <strong className="text-foreground">{company.regime_tributario}</strong></span>
          )}
          {(destCnaePrincipal || company?.cnae) && (
            <span
              title={
                destCnaePrincipal?.description
                  ? `${destCnaePrincipal.description}${
                      destCnaesSecundarios.length
                        ? '\n\nSecundários:\n' + destCnaesSecundarios.map(c => `${c.code} — ${c.description}`).join('\n')
                        : ''
                    }`
                  : undefined
              }
            >
              CNAE: <strong className="text-foreground font-mono text-xs">{destCnaePrincipal?.code || company.cnae}</strong>
              {destCnaePrincipal?.description && (
                <span className="text-muted-foreground ml-1">— {destCnaePrincipal.description}</span>
              )}
              {destCnaesSecundarios.length > 0 && (
                <span className="text-muted-foreground ml-1">(+{destCnaesSecundarios.length})</span>
              )}
            </span>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            Valor: <strong className="text-foreground">{formatCurrency(invoice.valor_servicos || invoice.vl_doc)}</strong>
          </span>
        </div>
        {!isNfse && (
          <div className="text-xs text-muted-foreground">
            Chave: <span className="font-mono">{invoice.chave_nfe || '-'}</span>
            {isNfse && invoice.codigo_servico_lc116 && <> | Servico: <span className="font-mono">{invoice.codigo_servico_lc116}</span></>}
          </div>
        )}
      </div>

      {/* Status reasons — show why the note was blocked/flagged */}
      {/* max-h-[25vh]: viewport-relative cap intentionally kept (não há token de escala p/ vh) */}
      {statusReasons && (
        <div className="bg-card border-b border-border px-6 py-4 max-h-[25vh] overflow-y-auto">
          <StatusReasons data={statusReasons} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 bg-card m-4 rounded-lg shadow-sm border border-border">
          {/* Sub Tabs */}
          <div className="px-6 pt-4 pb-3 flex justify-between items-center">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              {/* !h-11 força por cima do h-9 fixo do DS (ele vem com um
                  seletor group-data-[orientation] que empata/ganha de um
                  h-* comum — só o !important garante a sobrescrita). Os
                  triggers acompanham sozinhos (usam h-[calc(100%-1px)] do
                  próprio DS, relativo à altura do pai). */}
              <TabsList variant="default" className="!h-11 p-1.5">
                {isNfse ? (
                  <>
                    <TabsTrigger value="retencoes" className="px-3">Retencoes</TabsTrigger>
                    <TabsTrigger value="reinf" className="px-3">REINF Cruzamento</TabsTrigger>
                    <TabsTrigger value="espelho" className="px-3">Dados NFS-e</TabsTrigger>
                    <TabsTrigger value="auditoria" className="px-3">Auditoria</TabsTrigger>
                  </>
                ) : (
                  <>
                    <TabsTrigger value="escrituracao" className="px-3">Escrituracao</TabsTrigger>
                    <TabsTrigger value="espelho" className="px-3">Espelho NF-e</TabsTrigger>
                    <TabsTrigger value="auditoria" className="px-3">Auditoria</TabsTrigger>
                  </>
                )}
              </TabsList>
            </Tabs>
          </div>

          {/* Dynamic Content */}
          <div className="flex-1 overflow-auto p-6">
            {itemsLoading && !isNfse ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mr-2" />
                Carregando itens...
              </div>
            ) : activeTab === 'retencoes' ? (
              <NfseRetentionTab analysis={nfseAnalysis} invoiceId={invoice?.id} />
            ) : activeTab === 'reinf' ? (
              <NfseReinfCrossTab analysis={nfseAnalysis} invoice={invoice} />
            ) : activeTab === 'escrituracao' ? (
              <div>
                {escrituracaoLoading && (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mr-2" />
                    Carregando escrituracao...
                  </div>
                )}
                {!escrituracaoLoading && !effectiveEscrituracaoData && (
                  <div className="flex flex-col items-center justify-center h-48 gap-4">
                    {escrituracaoError && (
                      <p className="text-muted-foreground text-xs">Nenhum resultado persistido encontrado.</p>
                    )}
                    <p className="text-muted-foreground text-sm">Clique para analisar a escrituracao desta nota</p>
                    <Button
                      onClick={() => {
                        runEscrituracao.mutate({ invoiceId: invoice.id }, {
                          onSuccess: (data) => {
                            setEscrituracaoData(data)
                            invalidateAfterFeedback()
                          },
                        })
                      }}
                      disabled={runEscrituracao.isPending}
                    >
                      {runEscrituracao.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                      {runEscrituracao.isPending ? 'Analisando...' : 'Analisar Escrituracao'}
                    </Button>
                  </div>
                )}
                {effectiveEscrituracaoData && <EscrituracaoTab data={effectiveEscrituracaoData} invoice={invoice} />}
              </div>
            ) : activeTab === 'espelho' ? (
              isNfse ? (
                <DanfseTab invoice={invoice} analysis={nfseAnalysis} />
              ) : (
                <DanfeTab invoice={invoice} items={items} />
              )
            ) : activeTab === 'auditoria' ? (
              <AuditTab invoice={invoice} />
            ) : null}
          </div>
        </div>
      </div>

      {/* Correction Modal */}
      {showCorrectionModal && effectiveEscrituracaoData && (
        <CorrectionModal
          sugestoes={effectiveEscrituracaoData.sugestoes}
          onClose={() => setShowCorrectionModal(false)}
          onSubmit={handleSubmitCorrections}
          submitting={submittingCorrections}
        />
      )}
    </div>
  )
}
