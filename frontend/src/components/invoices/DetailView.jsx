import { useState } from 'react'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { ChevronLeft, Check, Pencil, Loader2, X, Save, Undo2, ExternalLink, AlertTriangle, RotateCcw } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
  Button, IconButton, Tabs, TabsList, TabsTrigger, Badge, Textarea,
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
import { resumoAprendizado } from '../escrituracao/aprendizado'
import AuditTab from './AuditTab'
import RevokePrecedentesNotasModal from '../precedentes/RevokePrecedentesNotasModal'
import { useHasRole, ROLE_FISCAL_ADM } from '../../auth/roles'
import { CST_ICMS, CSOSN_ENTRADA } from '../../constants/classificationOptions'
import { FINALIDADE_LABELS, getFinalidadesPermitidas, isRecipientNaoContribuinte } from '../../constants/finalidades'
import { getCstPisCofinsOptions } from '../escrituracao/cstPisCofinsOptions'
import { useToast } from '../shared/Toast'

// Sentinel values for the empty ("—"/"--") option in Radix Select — Radix
// disallows an empty-string SelectItem value.
const FINALIDADE_ALL_VALUE = '__none__'
const CST_ALL_VALUE = '__none__'

function formatCurrency(val) {
  if (val == null) return '-'
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function CorrectionModal({ sugestoes, onClose, onSubmit, submitting, naoContribuinte = false, regimeTributario, jaIntegrada = false, modo = 'correcao' }) {
  // Todos os itens da nota entram no modal (Célula 19/08 item 3.1): o motor
  // pode errar em item SEM divergência (nota Conforme) — antes o analista não
  // tinha como corrigir por aqui. Itens com divergência ganham destaque.
  const allItems = sugestoes || []
  // modo="aprendizado" (PQC-10, Q2): nota já enviada ao Onvio. Só o que o motor
  // aprende muda — nada é reenviado. Exige motivo e envia só os itens alterados
  // para api.corrigirAprendizado (não para o feedback comum).
  const aprendizado = modo === 'aprendizado'
  const [motivo, setMotivo] = useState('')
  const finalidadesPermitidas = getFinalidadesPermitidas(naoContribuinte)
  const cstPisCofinsOptions = getCstPisCofinsOptions(regimeTributario)

  // State: corrections per item { [invoice_item_id]: { finalidade, cfop_entrada, cst_icms, cst_pis, cst_cofins } }
  const [corrections, setCorrections] = useState(() => {
    const init = {}
    for (const s of allItems) {
      init[s.invoice_item_id] = {
        finalidade: s.finalidade || '',
        cfop_entrada: s.cfop_entrada || '',
        cst_icms: s.cst_icms_entrada || '',
        cst_pis: s.cst_pis_entrada || '',
        cst_cofins: s.cst_cofins_entrada || '',
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

  const buildCorrecoes = (s) => {
    const c = corrections[s.invoice_item_id]
    const correcoes = {}
    if (c.finalidade !== (s.finalidade || '')) correcoes.finalidade = c.finalidade
    if (c.cfop_entrada !== (s.cfop_entrada || '')) correcoes.cfop_entrada = c.cfop_entrada
    if (c.cst_icms !== (s.cst_icms_entrada || '')) correcoes.cst_icms = c.cst_icms
    // Aprendizado: a próxima nota não lê CST PIS/COFINS. Enviá-los revoga o
    // precedente sem plantar o valor no tratamento.
    if (!aprendizado) {
      if (c.cst_pis !== (s.cst_pis_entrada || '')) correcoes.cst_pis = c.cst_pis
      if (c.cst_cofins !== (s.cst_cofins_entrada || '')) correcoes.cst_cofins = c.cst_cofins
    }
    return correcoes
  }

  // Feedback vai para: (a) todo item ALTERADO pelo analista (correção) e
  // (b) todo item COM divergência, mesmo sem alteração (motor_acertou=true —
  // resolve a divergência pendente, comportamento pré-existente). Item sem
  // divergência e sem alteração NÃO gera feedback: exibi-lo no modal não é
  // revisão, e confirmar em massa contaminaria o aprendizado do motor.
  const buildFeedbacks = () => allItems
    .map(s => ({ s, correcoes: buildCorrecoes(s) }))
    .filter(({ s, correcoes }) => Object.keys(correcoes).length > 0 || s.divergencias?.length > 0)
    .map(({ s, correcoes }) => ({
      invoice_item_id: s.invoice_item_id,
      motor_acertou: Object.keys(correcoes).length === 0,
      correcoes: Object.keys(correcoes).length > 0 ? correcoes : undefined,
    }))

  // Aprendizado: só item ALTERADO conta — confirmar o motor não é correção de
  // aprendizado, e a nota enviada não recebe "motor_acertou".
  const buildItensAprendizado = () => allItems
    .map(s => ({ invoice_item_id: s.invoice_item_id, correcoes: buildCorrecoes(s) }))
    .filter(({ correcoes }) => Object.keys(correcoes).length > 0)

  const pendingFeedbacks = aprendizado ? buildItensAprendizado() : buildFeedbacks()
  const motivoOk = !aprendizado || motivo.trim().length > 0

  const handleSubmit = () => {
    if (pendingFeedbacks.length === 0 || !motivoOk) return
    if (aprendizado) onSubmit(pendingFeedbacks, motivo.trim())
    else onSubmit(pendingFeedbacks)
  }

  const handleOpenChange = (open) => {
    if (!open && !submitting) onClose()
  }

  if (allItems.length === 0) {
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
            <p className="text-sm text-muted-foreground">Nenhum item de escrituracao encontrado para esta nota.</p>
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
            <p className="text-sm text-muted-foreground font-medium">{aprendizado ? 'Gravando aprendizado...' : 'Enviando correções...'}</p>
            <p className="text-xs text-muted-foreground mt-1">{aprendizado ? 'A nota não é reprocessada nem reenviada.' : 'Aguarde, o motor está reprocessando a nota.'}</p>
          </div>
        )}
        {/* Header */}
        <SheetHeader className="flex-row items-center justify-between border-b border-border space-y-0 px-6 py-4">
          <SheetTitle>
            {aprendizado ? 'Corrigir aprendizado' : 'Corrigir Escrituracao'} ({allItems.length} itens)
          </SheetTitle>
          <IconButton aria-label="Fechar" variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
            <X className="w-5 h-5" />
          </IconButton>
        </SheetHeader>

        {/* Aprendizado: a nota já foi ao Onvio e fica como está. O que muda é o que
            o motor aprende para as próximas notas deste fornecedor e CFOP. */}
        {aprendizado && (
          <div className="mx-6 mt-4 space-y-3">
            <div className="flex items-start gap-2 bg-warning-subtle border border-warning-border rounded-lg px-3 py-2.5">
              <AlertTriangle className="w-4 h-4 text-warning-text flex-shrink-0 mt-0.5" />
              <p className="text-xs text-warning-text">
                Esta nota <strong>já foi enviada ao Onvio</strong>. Corrigir o aprendizado <strong>não altera a nota nem
                reenvia à Domínio</strong>: revoga o precedente e grava o tratamento correto para as
                <strong> próximas notas deste fornecedor e CFOP</strong>. O motor aprende finalidade,
                CFOP de entrada e CST ICMS. O ajuste desta nota é feito direto na Domínio.
              </p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Motivo <span className="text-destructive-text">*</span></label>
              <Textarea
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                rows={2}
                placeholder="ex: 6102 é revenda, não industrialização — Célula 25/09"
                className="w-full text-sm"
              />
            </div>
          </div>
        )}

        {/* Nota já integrada ao Domínio: correção fica registrada p/ aprendizado, mas não republica o lançamento já enviado */}
        {!aprendizado && jaIntegrada && (
          <div className="mx-6 mt-4 flex items-start gap-2 bg-warning-subtle border border-warning-border rounded-lg px-3 py-2.5">
            <AlertTriangle className="w-4 h-4 text-warning-text flex-shrink-0 mt-0.5" />
            <p className="text-xs text-warning-text">
              Esta nota <strong>já foi integrada ao Domínio</strong>. As correções salvas aqui alimentam o aprendizado do motor,
              mas <strong>não republicam</strong> o lançamento já enviado.
            </p>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {allItems.map(s => (
            <div key={s.invoice_item_id} className={`border rounded-lg p-4 ${s.divergencias?.length > 0 ? 'border-warning-border bg-warning-subtle' : 'border-border'}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-sm font-semibold text-foreground">{s.descricao || `Item #${s.invoice_item_id}`}</span>
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    {s.ncm && <span>NCM: <strong className="text-foreground">{s.ncm}</strong></span>}
                    {s.valor_item != null && <span>Valor: <strong className="text-foreground">{Number(s.valor_item).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></span>}
                    {s.cfop_emitente && <span>CFOP Emit: <strong className="text-foreground">{s.cfop_emitente}</strong></span>}
                  </div>
                </div>
                {s.divergencias?.length > 0
                  ? <span className="text-xs text-destructive-text font-medium">{s.divergencias.length} divergencia(s)</span>
                  : <span className="text-xs text-success-text font-medium">Sem divergencia</span>}
              </div>

              {/* Show divergences */}
              {s.divergencias?.length > 0 && (
                <div className="mb-3 space-y-1">
                  {s.divergencias.map((d, i) => (
                    <div key={i} className="text-xs bg-destructive-subtle text-destructive-text px-2 py-1 rounded">
                      <strong>{d.campo}</strong>: emitente={d.valor_emitente || '—'} / sugerido={d.valor_sugerido || '—'}
                      {d.descricao && <span className="text-destructive-text ml-1">({d.descricao})</span>}
                    </div>
                  ))}
                </div>
              )}

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
                      {finalidadesPermitidas.map(f => (
                        <SelectItem key={f} value={f}>{FINALIDADE_LABELS[f] || f}</SelectItem>
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
                        {CSOSN_ENTRADA.map(o => (
                          <SelectItem key={`csosn-${o.code}`} value={o.code}>{o.code} - {o.description}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* CST PIS + COFINS: só na correção da nota. No aprendizado a próxima nota não lê esses CST. */}
              {!aprendizado && <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">CST PIS</label>
                  <Select
                    value={corrections[s.invoice_item_id]?.cst_pis || CST_ALL_VALUE}
                    onValueChange={v => updateField(s.invoice_item_id, 'cst_pis', v === CST_ALL_VALUE ? '' : v)}
                  >
                    <SelectTrigger className="w-full h-auto py-1.5 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CST_ALL_VALUE}>--</SelectItem>
                      {cstPisCofinsOptions.map(o => (
                        <SelectItem key={o.code} value={o.code}>{o.code} - {o.desc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">CST COFINS</label>
                  <Select
                    value={corrections[s.invoice_item_id]?.cst_cofins || CST_ALL_VALUE}
                    onValueChange={v => updateField(s.invoice_item_id, 'cst_cofins', v === CST_ALL_VALUE ? '' : v)}
                  >
                    <SelectTrigger className="w-full h-auto py-1.5 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CST_ALL_VALUE}>--</SelectItem>
                      {cstPisCofinsOptions.map(o => (
                        <SelectItem key={o.code} value={o.code}>{o.code} - {o.desc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>}
            </div>
          ))}
        </div>

        {/* Footer */}
        <SheetFooter className="flex-row items-center justify-end gap-3 border-t border-border px-6 py-4">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || pendingFeedbacks.length === 0 || !motivoOk}
            title={pendingFeedbacks.length === 0
              ? (aprendizado ? 'Altere ao menos um item' : 'Nenhuma alteracao ou divergencia a salvar')
              : (!motivoOk ? 'Informe o motivo' : undefined)}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {aprendizado ? 'Corrigir aprendizado' : 'Salvar Correcoes'}
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
  const {
    data: nfseAnalysis,
    isLoading: nfseAnalysisLoading,
    isError: nfseAnalysisError,
  } = useNfseAnalysis(isNfse ? invoice?.id : null)
  const runEscrituracao = useRunEscrituracao()
  // Carrega com qualquer aba ativa (como a análise de NFS-e acima): os botões do
  // cabeçalho dependem dela e sumiam ao trocar para Espelho/Auditoria.
  const { data: persistedEscrituracao, isLoading: escrituracaoLoading, error: escrituracaoError } = useEscrituracao(
    !isNfse ? invoice?.id : null
  )
  const [escrituracaoData, setEscrituracaoData] = useState(null)
  const { data: companies = [] } = useCompanies()
  const company = companies.find(c => c.id === invoice?.company_id) || null
  const { data: invoiceDetail } = useInvoiceDetail(invoice?.id)
  const emitter = invoiceDetail?.emitter || null
  // escrituracao_status vem do DETALHE, nao do prop da listagem: o prop e uma
  // foto do momento em que a lista carregou, entao confirmar a analise nao
  // mudava o badge (a rota do detalhe nem computava o campo — corrigido na
  // Fase 3). Fallback no prop enquanto o detalhe nao chegou.
  const escrituracaoStatus = invoiceDetail?.invoice?.escrituracao_status
    ?? invoice?.escrituracao_status
  const escriturada = escrituracaoStatus === 'ESCRITURADA'
  // Escrituracao NFTS: o robo declarou a nota na prefeitura (write-back da
  // API de apuracoes, escriturada_autopilot_em). Dimensao propria — nao e o
  // OK do analista (escriturada_em) nem a integracao (integrado_api_em).
  const escrituradaNftsEm = invoiceDetail?.invoice?.escriturada_autopilot_em
    ?? invoice?.escriturada_autopilot_em

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
  // 'correcao' (feedback comum) ou 'aprendizado' (nota já enviada, PQC-10)
  const [modoCorrecao, setModoCorrecao] = useState('correcao')
  const [submittingCorrections, setSubmittingCorrections] = useState(false)
  const [buscandoXmlOriginal, setBuscandoXmlOriginal] = useState(false)
  const [revogandoPrecedentes, setRevogandoPrecedentes] = useState(false)
  const isFiscalAdm = useHasRole(ROLE_FISCAL_ADM)
  const undoMutation = useUndoEscrituracao()

  // Use persisted data when available
  const effectiveEscrituracaoData = escrituracaoData || persistedEscrituracao

  // "Ver XML original": o backend devolve uma URL presigned (S3 do upstream) e
  // o browser é quem abre. A aba é aberta ANTES do await de propósito — aba
  // aberta dentro de um `then` perde o vínculo com o clique e o navegador a
  // bloqueia como popup; se a busca falhar, ela é fechada e o erro (que já vem
  // acionável do backend: nomeia a fonte de captura) aparece no banner.
  const handleVerXmlOriginal = async () => {
    const aba = window.open('', '_blank')
    setBuscandoXmlOriginal(true)
    try {
      const { url } = await api.getDocumentoOriginal(invoice.id)
      if (aba) aba.location.href = url
      else window.open(url, '_blank', 'noopener')
    } catch (e) {
      if (aba) aba.close()
      // Toast (padrão do proto) fica visível independente da rolagem do detalhe;
      // a mensagem já vem acionável do backend (nomeia a fonte de captura).
      toast.error('Não foi possível abrir o XML original', { description: e.message, duration: 8000 })
    } finally {
      setBuscandoXmlOriginal(false)
    }
  }

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
      // "Confirmar e Escriturar" (handleConfirmAll) marca feedbackDone.
      setShowCorrectionModal(false)
      setFeedbackMessage({ type: 'success', text: 'Correcoes salvas. Motor re-processou a nota. Confirme e escriture quando concluir a conferência (envia ao Onvio).' })
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

  // Nota já enviada: corrige só o APRENDIZADO (PQC-10). O status e o badge da
  // nota não mudam; o resumo por item fica no banner até o analista fechar.
  const handleSubmitAprendizado = async (itens, motivo) => {
    setSubmittingCorrections(true)
    try {
      const res = await api.corrigirAprendizado(invoice.id, itens, motivo)
      setShowCorrectionModal(false)
      setFeedbackMessage({
        type: 'success',
        text: `Aprendizado corrigido em ${res.itens?.length ?? 0} item(ns). A nota não foi alterada nem reenviada à Domínio.`,
        detalhes: resumoAprendizado(res, effectiveEscrituracaoData?.sugestoes),
      })
      // Só a Auditoria e o histórico mudam; a escrituração e a lista ficam iguais.
      queryClient.invalidateQueries({ queryKey: ['invoice', invoice.id] })
      queryClient.invalidateQueries({ queryKey: ['invoiceAuditEvents', invoice.id] })
    } catch (e) {
      console.error('Learning correction error:', e)
      setShowCorrectionModal(false)
      setFeedbackMessage({ type: 'error', text: `Erro ao corrigir aprendizado: ${e.message}` })
    } finally {
      setSubmittingCorrections(false)
    }
  }

  if (!invoice) return null

  const docLabel = isNfse ? 'NFS-e' : 'NF-e'
  // "Corrigir" não depende mais de haver divergência (Célula 19/08 item 3.1):
  // o motor também erra em nota CONFORME, e antes o time só podia corrigir
  // nota a nota. Disponível em CONFORME/REQUER_REVISAO/CRITICO; BLOQUEADO e
  // DISPENSADO (store-only) ficam de fora. Status do detalhe > foto da lista.
  const statusAnalise = invoiceDetail?.invoice?.status_analise ?? invoice?.status_analise
  const podeCorrigir = !['BLOQUEADO', 'DISPENSADO'].includes(statusAnalise)
  // Read-only depois do envio ao Onvio (Invoice.ja_enviada_ao_onvio no backend,
  // #394): a correção daria 409. Enquanto o detalhe carrega, vale o integrado_api_em.
  const jaEnviada = invoiceDetail?.invoice?.ja_enviada_ao_onvio ?? !!invoice?.integrado_api_em
  const estaFechada = feedbackDone || escriturada
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
          {isNfse && escrituradaNftsEm && (
            <Badge
              variant="info"
              title={`Declarada na prefeitura em ${new Date(escrituradaNftsEm).toLocaleDateString('pt-BR')}`}
            >
              Escrituração NFTS: Escriturada
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          {(invoice.chave_nfe || invoice.num_doc) && (
            <Button
              variant="outline"
              onClick={handleVerXmlOriginal}
              disabled={buscandoXmlOriginal}
              title="Abre o XML como veio do prestador/fornecedor, seja qual for a fonte de captura"
            >
              {buscandoXmlOriginal
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <ExternalLink className="w-4 h-4" />}
              Ver XML original
            </Button>
          )}
          {isFiscalAdm && (
            <Button
              variant="outline"
              onClick={() => setRevogandoPrecedentes(true)}
              title="Revoga os precedentes que esta nota usou e reprocessa as notas afetadas (sem publicar no Onvio)"
              className="text-warning-text border-warning-border hover:bg-warning-subtle hover:text-warning-text"
            >
              <RotateCcw className="w-4 h-4" />
              Revogar precedentes
            </Button>
          )}
          {/* "Corrigir" não depende de a escrituração estar fechada (Célula 10/09,
              R1): nota Conforme já escriturada também precisa de correção, e
              depois do Desfazer ele continua aqui. Só a nota já enviada ao Onvio
              é read-only (#728): nela o botão dá lugar a "Corrigir aprendizado"
              (PQC-10, fiscal-adms), que muda só o que o motor aprende. */}
          {effectiveEscrituracaoData && podeCorrigir && !jaEnviada && (
            <Button
              variant="warning"
              onClick={() => { setModoCorrecao('correcao'); setShowCorrectionModal(true) }}
              title="Corrigir a escrituração dos itens"
            >
              <Pencil className="w-4 h-4" /> Corrigir
            </Button>
          )}
          {effectiveEscrituracaoData && podeCorrigir && jaEnviada && !isNfse && (
            <Button
              variant="outline"
              onClick={() => { setModoCorrecao('aprendizado'); setShowCorrectionModal(true) }}
              disabled={!isFiscalAdm}
              title={isFiscalAdm
                ? 'Nota já enviada ao Onvio: corrige só o que o motor aprendeu (precedente e tratamento) para as próximas notas deste fornecedor e CFOP. Não altera a nota nem reenvia à Domínio.'
                : 'Nota já enviada ao Onvio: o BHub não aceita mais correções nela — ajuste direto no Onvio. Corrigir o aprendizado exige o papel fiscal-adms.'}
              className="text-warning-text border-warning-border hover:bg-warning-subtle hover:text-warning-text"
            >
              <Pencil className="w-4 h-4" /> Corrigir aprendizado
            </Button>
          )}
          {effectiveEscrituracaoData && !estaFechada && (
            <Button
              variant="success"
              onClick={handleConfirmAll}
              disabled={confirmingAll || hasItensPendentes}
              title={hasItensPendentes
                ? 'Há itens pendentes (divergências CRÍTICO/ALERTA). Resolva-os com "Corrigir" antes de confirmar e escriturar.'
                : 'Confirma, escritura e envia ao Onvio (definitivo)'}
            >
              {confirmingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Confirmar e Escriturar
            </Button>
          )}
          {estaFechada && (
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
                <Check className="w-4 h-4" /> {isNfse ? 'Escriturada' : 'Escrituracao Confirmada'}
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
          <div className="flex-1">
            {feedbackMessage.text}
            {feedbackMessage.detalhes?.length > 0 && (
              <ul className="mt-1 text-xs font-normal space-y-0.5">
                {feedbackMessage.detalhes.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            )}
          </div>
          <IconButton aria-label="Fechar aviso" variant="ghost" size="sm" className="ml-auto self-start" onClick={() => setFeedbackMessage(null)}>
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
          <span>CNPJ: <strong className="text-foreground font-mono text-xs">{invoice.dest_cnpj || company?.cnpj || '-'}</strong></span>
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
              <NfseRetentionTab
                analysis={nfseAnalysis}
                invoiceId={invoice?.id}
                invoice={invoice}
                isLoading={nfseAnalysisLoading}
                isError={nfseAnalysisError}
              />
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
                    {/* 404 = nota ainda não analisada; outro erro não pode parecer isso. */}
                    {escrituracaoError && !/^API 404/.test(escrituracaoError.message || '') ? (
                      <p className="text-destructive-text text-xs">
                        Não foi possível carregar a escrituração desta nota: {escrituracaoError.message}
                      </p>
                    ) : (
                      <p className="text-muted-foreground text-sm text-center max-w-md">
                        Esta nota ainda não passou pela escrituração. Clique em <strong>Analisar Escrituração</strong>:
                        os botões <strong>Corrigir</strong> e <strong>Confirmar e Escriturar</strong> aparecem depois da análise.
                      </p>
                    )}
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
                      {runEscrituracao.isPending ? 'Analisando...' : 'Analisar Escrituração'}
                    </Button>
                  </div>
                )}
                {effectiveEscrituracaoData && (
                  <EscrituracaoTab data={effectiveEscrituracaoData} invoice={invoice} jaEnviada={jaEnviada && !isNfse} />
                )}
              </div>
            ) : activeTab === 'espelho' ? (
              isNfse ? (
                <DanfseTab invoice={invoice} analysis={nfseAnalysis} company={company} />
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
          onSubmit={modoCorrecao === 'aprendizado' ? handleSubmitAprendizado : handleSubmitCorrections}
          submitting={submittingCorrections}
          naoContribuinte={isRecipientNaoContribuinte(company, invoice)}
          regimeTributario={company?.regime_tributario}
          jaIntegrada={!!invoice.integrado_api_em}
          modo={modoCorrecao}
        />
      )}

      <RevokePrecedentesNotasModal
        invoiceIds={revogandoPrecedentes ? [invoice.id] : null}
        onClose={() => setRevogandoPrecedentes(false)}
        onRevoked={() => setRevogandoPrecedentes(false)}
      />
    </div>
  )
}
