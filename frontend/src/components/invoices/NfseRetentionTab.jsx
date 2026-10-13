import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle, AlertTriangle, XCircle, ThumbsUp, ThumbsDown, Send, Loader2, Check, FileWarning, Scale, ChevronDown, ChevronRight } from 'lucide-react'
import {
  Button, Badge, Input, Label,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Tooltip, TooltipTrigger, TooltipContent,
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@bhubai/bhub-design-system'
import { api } from '../../api/client'
import { useHasRole, ROLE_FISCAL_ADM } from '../../auth/roles'
import NfsePrecedentesPanel from '../precedentes/NfsePrecedentesPanel'
import RevokeNfsePrecedenteModal from '../precedentes/RevokeNfsePrecedenteModal'
import { chavesParaConfirmar } from './nfseFeedbackKeys'

// Fonte que indica que a determinação de retenção veio do precedente NFS-e
// v2 (mesmo rule_code usado pelo ground-truth legado — ver nfse_engine.py).
const NFSE_PRECEDENTE_RULE_CODE = 'NFSE-GT-001'

// Extrai o id do precedente aplicado da regra NFSE-GT-001. Preferência pelo
// campo estruturado `precedente_id` (contrato do engine); o regex na
// description (ex.: "IRRF: alíquota 1%→1,5% (precedente 42)") fica como
// fallback para análises antigas serializadas sem o campo. Retorna null
// quando a regra não está presente ou é o ground-truth legado por CNPJ, que
// não tem precedente revogável.
function extractPrecedenteId(analysis) {
  const results = analysis?.results || []
  for (const r of results) {
    if (r.rule_code !== NFSE_PRECEDENTE_RULE_CODE) continue
    if (r.precedente_id != null) return Number(r.precedente_id)
    const m = /precedente\s+(\d+)/i.exec(r.description || '')
    if (m) return Number(m[1])
  }
  return null
}

// Há ajuste NFSE-GT-001 na análise, com ou sem precedente revogável? Usado
// para mostrar o badge informativo quando o ajuste veio do ground-truth
// legado (sem id — nada a revogar no painel de precedentes).
function hasGroundTruthAdjustment(analysis) {
  return (analysis?.results || []).some((r) => r.rule_code === NFSE_PRECEDENTE_RULE_CODE)
}

function formatCurrency(val) {
  if (val == null || val === '' || val === '0' || val === 0) return 'R$ 0,00'
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function StatusIcon({ status }) {
  if (status === 'ok') return <CheckCircle className="w-4 h-4 text-success-text" />
  if (status === 'divergente') return <AlertTriangle className="w-4 h-4 text-warning-text" />
  if (status === 'ausente') return <XCircle className="w-4 h-4 text-destructive-text" />
  return <span className="text-muted-foreground text-xs">-</span>
}

function StatusLabel({ status }) {
  const labels = {
    ok: 'Conforme',
    divergente: 'Divergente',
    ausente: 'Ausente',
    dispensado: 'Dispensado',
    na: 'N/A',
  }
  const variants = {
    ok: 'success',
    divergente: 'warning',
    ausente: 'destructive',
    dispensado: 'secondary',
    na: 'secondary',
  }
  return (
    <Badge variant={variants[status] || variants.na}>
      <StatusIcon status={status} />
      {labels[status] || status}
    </Badge>
  )
}

function getRetentionStatus(esperado, nfse, aplicavel) {
  if (aplicavel === false) return 'dispensado'
  const esp = Number(esperado || 0)
  const nf = Number(nfse || 0)
  if (esp === 0 && nf === 0) return 'na'
  if (esp > 0 && nf === 0) return 'ausente'
  if (Math.abs(esp - nf) <= 0.10) return 'ok'
  return 'divergente'
}

// Map display tributo names to the feedback tributo keys used by the backend
function getFeedbackTributo(tributo) {
  const map = { PIS: 'PCC', COFINS: 'PCC', CSLL: 'PCC' }
  return map[tributo] || tributo
}


// NFSC-02: badge por linha com o feedback já gravado para a chave do tributo.
// PIS/COFINS/CSLL mostram o mesmo badge — gravam juntas em PCC.
function FeedbackBadge({ feedback }) {
  const corrigido = feedback.tipo === 'corrigido'
  const v = feedback.valores || {}
  const detalhes = [
    v.base != null && `base ${v.base}`,
    v.aliquota != null && `aliquota ${v.aliquota}%`,
    v.valor != null && `valor ${v.valor}`,
    v.retido != null && (v.retido ? 'retido' : 'nao retido'),
    feedback.em && `em ${new Date(feedback.em).toLocaleString('pt-BR')}`,
  ].filter(Boolean).join(' · ')
  const badge = (
    <Badge
      variant="outline"
      className={`ml-2 gap-1 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${
        corrigido ? 'bg-warning-subtle text-warning-text border-warning-border' : 'bg-success-subtle text-success-text border-success-border'
      }`}
    >
      {corrigido ? <AlertTriangle className="w-3 h-3" /> : <Check className="w-3 h-3" />}
      {corrigido ? 'corrigido' : 'confirmado'}
    </Badge>
  )
  if (!detalhes) return badge
  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent>{detalhes}</TooltipContent>
    </Tooltip>
  )
}

// U2 — fundamentação legal dinâmica (Fase 3 não-gated): resumo_regras.
// fundamentacoes é persistido pelo audit trail (chaveado por irrf/pcc/inss/
// iss), MAS só no caminho de lote (enable_dynamic_legislation=True) — a
// análise on-demand usada por esta aba (get_nfse_analysis) não a calcula.
// Lemos de `analysis.fundamentacoes[tributo]` (mesmo nome/chaves do dict
// persistido) para já vir funcionando no dia em que essa análise também
// passar a expor o campo; até lá, undefined ⇒ fallback estático (sem
// mudança de visual, conforme especificado).
function fundamentacoesFor(analysis, tributoDisplay) {
  const key = getFeedbackTributo(tributoDisplay).toLowerCase()
  const list = analysis?.fundamentacoes?.[key]
  return Array.isArray(list) && list.length > 0 ? list : null
}

function FundamentacaoExpander({ fundamentacoes }) {
  const [expanded, setExpanded] = useState(false)
  if (!fundamentacoes?.length) return null
  return (
    <div className="mt-1">
      <Button
        type="button"
        variant="ghost"
        size="xs"
        onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v) }}
        className="h-auto p-0 gap-1 text-xs font-medium text-success-text hover:text-success-text hover:bg-transparent"
      >
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        <Scale className="w-3 h-3" /> Fundamentação ({fundamentacoes.length})
      </Button>
      {expanded && (
        <div className="mt-1.5 bg-card rounded-lg border border-border divide-y divide-border max-w-md">
          {fundamentacoes.map((f, i) => (
            <div key={i} className="px-2.5 py-1.5">
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <span className="text-xs font-semibold text-foreground break-words">{f.norma}</span>
                {f.dispositivo && (
                  <span className="text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground font-mono whitespace-nowrap">
                    {f.dispositivo}
                  </span>
                )}
                {f.similarity != null && (
                  <span className="text-[10px] text-muted-foreground">{(f.similarity * 100).toFixed(0)}% relev.</span>
                )}
              </div>
              {f.texto && (
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed break-words line-clamp-2">
                  {f.texto}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Nota ingerida somente com o cabecalho (sem os campos de servico/valor) faz o
// motor devolver uma analise "casca vazia" — sem classificacao nem valores.
// Não é erro de rede, mas não ha nada de util pra mostrar na tabela.
function isAnalysisEmpty(analysis) {
  if (!analysis) return true
  const cls = analysis.classification || {}
  const vlq = analysis.valor_liquido || {}
  const hasClassificacao = !!(cls.codigo_servico || cls.descricao_servico)
  const hasValor = Number(vlq.valor_bruto || 0) > 0
  return !hasClassificacao && !hasValor
}

function RetentionSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-20 bg-muted rounded-lg border border-border" />
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="h-10 bg-muted border-b border-border" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-11 bg-card border-b border-border last:border-b-0" />
        ))}
      </div>
    </div>
  )
}

function IncompleteAnalysisBanner() {
  return (
    <div className="flex items-start gap-3 bg-warning-subtle border border-warning-border rounded-lg p-4">
      <FileWarning className="w-5 h-5 text-warning-text shrink-0 mt-0.5" />
      <p className="text-sm text-warning-text">
        Não foi possível montar a análise — dados de serviço incompletos nesta nota (ingestão parcial).
        Valores disponíveis na aba <strong>Dados NFS-e</strong>.
      </p>
    </div>
  )
}

// T21 (NFSC-04): mesmo padrão do CorrectionModal da NF-e (DetailView.jsx) —
// N linhas num único modal, aqui uma por tributo. Um submit = N feedbacks,
// só dos blocos que o analista alterou: linha intocada não é revisão (quem
// encerra a revisão é "Confirmar Analise", que confirma o que não foi
// corrigido).
//
// PCC-01: PIS/COFINS/CSLL são três linhas do bloco "PCC (PIS + COFINS +
// CSLL)" com UM conjunto de campos. O feedback grava a chave PCC
// (getFeedbackTributo): colunas *_pcc_humano do ground truth e o override
// `pcc` do precedente v2, que não distinguem os três. Separar mexe no modelo
// de nfse_ground_truth e nos precedentes: ADIADO por decisão de produto
// (spec 2026-08-04-nfse-primeira-classe, Non-Goals).
// SPEC_DEVIATION: as três linhas do PCC compartilham base/alíquota/valor/
// retenção/comentário em vez de um conjunto de campos por linha.
// Reason: três feedbacks com a chave PCC na mesma chamada sobrescreveriam as
// mesmas colunas (o último vence) e o serializer/badge só conhecem PCC.
const BLOCOS_CORRECAO = [
  { key: 'IRRF', label: 'IRRF', tributos: ['IRRF'] },
  { key: 'PCC', label: 'PCC (PIS + COFINS + CSLL)', tributos: ['PIS', 'COFINS', 'CSLL'] },
  { key: 'INSS', label: 'INSS', tributos: ['INSS'] },
  { key: 'ISS', label: 'ISS', tributos: ['ISS'] },
]

const CAMPOS_VAZIOS = { base: '', aliquota: '', valor: '', retido: '', comment: '' }

// Campos preenchidos → feedback do bloco; nada preenchido → null (não envia).
function buildFeedback(key, c) {
  const correcoes = {}
  if (c.base !== '') correcoes.base = parseFloat(c.base)
  if (c.aliquota !== '') correcoes.aliquota = parseFloat(c.aliquota)
  if (c.valor !== '') correcoes.valor = parseFloat(c.valor)
  if (c.retido !== '') correcoes.retido = c.retido === 'true'
  const temCorrecao = Object.keys(correcoes).length > 0
  if (!temCorrecao && !c.comment) return null
  return {
    tributo: key,
    motor_acertou: false,
    correcoes: temCorrecao ? correcoes : null,
    comment: c.comment || null,
  }
}

// Sentinela do Select "Retencao" (Radix não aceita SelectItem com value="").
const RETIDO_MANTER = '__manter__'

function CorrectionModal({ rows, onClose, onSubmit }) {
  const [campos, setCampos] = useState(() =>
    Object.fromEntries(BLOCOS_CORRECAO.map((b) => [b.key, { ...CAMPOS_VAZIOS }]))
  )
  const update = (key, field, value) =>
    setCampos((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }))

  const rowsPorTributo = Object.fromEntries(rows.map((r) => [r.tributo, r]))
  const feedbacks = BLOCOS_CORRECAO.map((b) => buildFeedback(b.key, campos[b.key])).filter(Boolean)

  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent side="right" className="w-full sm:max-w-3xl p-0 gap-0 flex flex-col">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Corrigir Retencoes ({rows.length} tributos)</SheetTitle>
          <SheetDescription>
            Informe os valores corretos. Deixe em branco os campos que o motor acertou;
            tributo sem alteracao nao gera feedback.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {BLOCOS_CORRECAO.map((b) => {
            const linhas = b.tributos.map((t) => rowsPorTributo[t]).filter(Boolean)
            const c = campos[b.key]
            const alterado = !!buildFeedback(b.key, c)
            const feedback = linhas[0]?.feedback
            const esperadoBloco = linhas.reduce((acc, r) => acc + Number(r.esperado || 0), 0)
            return (
              <div
                key={b.key}
                className={`border rounded-lg p-4 ${alterado ? 'border-info-border bg-info-subtle' : 'border-border'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground">
                    {b.label}
                    {feedback && <FeedbackBadge feedback={feedback} />}
                  </span>
                  {alterado
                    ? <span className="text-xs text-info-text font-medium">Sera enviado</span>
                    : <span className="text-xs text-muted-foreground">Sem alteracao</span>}
                </div>

                {/* O que o motor calculou, uma linha por tributo do bloco */}
                <div className="mb-3 border border-border rounded bg-card text-xs">
                  <div className="grid grid-cols-6 gap-2 px-2 py-1 text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                    <span>Tributo</span>
                    <span className="text-right">Base</span>
                    <span className="text-right">Aliquota</span>
                    <span className="text-right">Esperado</span>
                    <span className="text-right">NFS-e</span>
                    <span className="text-right">Status</span>
                  </div>
                  {linhas.map((r) => (
                    <div key={r.tributo} className="grid grid-cols-6 gap-2 px-2 py-1 items-center">
                      <span className="font-semibold text-foreground">{r.tributo}</span>
                      <span className="font-mono text-muted-foreground text-right">{formatCurrency(r.base)}</span>
                      <span className="font-mono text-muted-foreground text-right">{r.aliquota}</span>
                      <span className="font-mono text-foreground text-right">{formatCurrency(r.esperado)}</span>
                      <span className="font-mono text-muted-foreground text-right">{formatCurrency(r.nfse)}</span>
                      <span className="text-right"><StatusLabel status={r.status} /></span>
                    </div>
                  ))}
                </div>

                {linhas.length > 1 && (
                  <p className="text-xs text-warning-text mb-2">
                    PIS, COFINS e CSLL gravam juntas como <strong>PCC</strong>: os campos abaixo valem para as tres.
                  </p>
                )}

                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <Label className="block text-xs font-medium text-muted-foreground mb-1">Base de Calculo (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={c.base}
                      onChange={(e) => update(b.key, 'base', e.target.value)}
                      placeholder={linhas[0]?.base != null ? String(linhas[0].base) : ''}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Label className="block text-xs font-medium text-muted-foreground mb-1">Aliquota (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={c.aliquota}
                      onChange={(e) => update(b.key, 'aliquota', e.target.value)}
                      placeholder={linhas.length === 1 && linhas[0].aliquota !== '-' ? linhas[0].aliquota.replace('%', '') : ''}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Label className="block text-xs font-medium text-muted-foreground mb-1">Valor Correto (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={c.valor}
                      onChange={(e) => update(b.key, 'valor', e.target.value)}
                      placeholder={esperadoBloco > 0 ? esperadoBloco.toFixed(2) : ''}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Label className="block text-xs font-medium text-muted-foreground mb-1">Retencao</Label>
                    {/* Radix Select não aceita value="" — RETIDO_MANTER mapeia para '' (sem correção). */}
                    <Select
                      value={c.retido === '' ? RETIDO_MANTER : c.retido}
                      onValueChange={(v) => update(b.key, 'retido', v === RETIDO_MANTER ? '' : v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={RETIDO_MANTER}>Manter</SelectItem>
                        <SelectItem value="true">Retido</SelectItem>
                        <SelectItem value="false">Nao retido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-2">
                  <Label className="block text-xs font-medium text-muted-foreground mb-1">Comentario (opcional)</Label>
                  <Input
                    type="text"
                    value={c.comment}
                    onChange={(e) => update(b.key, 'comment', e.target.value)}
                    placeholder="Ex: Aliquota correta conforme LC 116 item 7.02"
                  />
                </div>
              </div>
            )
          })}
        </div>

        <SheetFooter className="flex-row items-center justify-between gap-2 border-t border-border shrink-0">
          <span className="text-xs text-muted-foreground">
            {feedbacks.length === 0
              ? 'Nenhum tributo alterado'
              : `${feedbacks.length} tributo(s) a enviar: ${feedbacks.map((f) => f.tributo).join(', ')}`}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={() => onSubmit(feedbacks)} disabled={feedbacks.length === 0}>
              <Send className="w-4 h-4" />
              Enviar Correcoes
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default function NfseRetentionTab({ analysis, invoiceId, invoice, isLoading = false, isError = false }) {
  const [correctionModal, setCorrectionModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState(null)
  // NFSC-02: o que foi enviado NESTA sessão, por chave de feedback, até a
  // query da análise ser refeita. Guardado com o invoiceId para não vazar
  // para outra nota. A fonte de verdade é analysis.feedbacks (servidor).
  const [feedbackLocal, setFeedbackLocal] = useState({ invoiceId: null, map: {} })
  const [showPrecedentesPanel, setShowPrecedentesPanel] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState(null) // { precedenteId, prestadorCnpj, codigoServico } | null

  const queryClient = useQueryClient()
  const isFiscalAdm = useHasRole(ROLE_FISCAL_ADM)
  // Mesmo mecanismo de role-gate do NF-e (EscrituracaoTab): só fiscal-adms
  // pode revogar, e só quando a nota carrega a chave (company + prestador).
  const canRevogarPrecedente = isFiscalAdm && !!invoice?.company_id && !!invoice?.emit_cnpj

  if (isLoading) {
    return <RetentionSkeleton />
  }

  if (isError || isAnalysisEmpty(analysis)) {
    return <IncompleteAnalysisBanner />
  }

  const ret = analysis.retencoes || {}
  const cls = analysis.classification || {}

  // NFSC-02: mapa por tributo hidratado do servidor (analysis.feedbacks, lido
  // de nfse_ground_truth + feedbacks) — sobrevive a recarregar e a trocar de
  // nota — com o overlay do que acabou de ser enviado nesta sessão. Chave =
  // getFeedbackTributo: PIS/COFINS/CSLL compartilham a entrada PCC.
  const feedbackPorTributo = {
    ...(analysis.feedbacks || {}),
    ...(feedbackLocal.invoiceId === invoiceId ? feedbackLocal.map : {}),
  }
  const marcarLocal = (entradas) => setFeedbackLocal((prev) => ({
    invoiceId,
    map: { ...(prev.invoiceId === invoiceId ? prev.map : {}), ...entradas },
  }))

  // U1 — badge de precedente (Fase 3 não-gated): NFSE-GT-001 na análise
  // on-demand indica que um precedente v2 foi aplicado a esta nota.
  const precedenteId = extractPrecedenteId(analysis)
  const groundTruthSemPrecedente = precedenteId == null && hasGroundTruthAdjustment(analysis)

  const handleRevogarPrecedente = (p) => {
    if (!canRevogarPrecedente) return
    setRevokeTarget({
      precedenteId: p.id,
      prestadorCnpj: invoice?.emit_cnpj,
      codigoServico: p.codigo_servico_lc116,
    })
  }

  const handleRevoked = () => {
    setRevokeTarget(null)
    setShowPrecedentesPanel(false)
    queryClient.invalidateQueries({ queryKey: ['nfseAnalysis', invoiceId] })
    queryClient.invalidateQueries({ queryKey: ['invoices'] })
    queryClient.invalidateQueries({ queryKey: ['statusCounts'] })
  }

  // Confirmar/corrigir muda o VEREDITO e (na confirmacao) carimba
  // escriturada_em no backend. Sem invalidar, o estado ficava so local: o badge
  // do detalhe e a coluna "Escrituracao" continuavam mostrando o valor antigo
  // ate um reload manual. ['invoice', id] e a query do detalhe (useInvoiceDetail),
  // que agora traz escrituracao_status computado.
  const invalidateAposFeedback = () => {
    queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
    queryClient.invalidateQueries({ queryKey: ['nfseAnalysis', invoiceId] })
    queryClient.invalidateQueries({ queryKey: ['invoices'] })
    queryClient.invalidateQueries({ queryKey: ['statusCounts'] })
  }

  const rows = [
    {
      tributo: 'IRRF',
      base: ret.irrf?.base,
      aliquota: ret.irrf?.aliquota ? `${ret.irrf.aliquota}%` : '-',
      esperado: ret.irrf?.valor_esperado,
      nfse: ret.irrf?.valor_nfse,
      status: getRetentionStatus(ret.irrf?.valor_esperado, ret.irrf?.valor_nfse, ret.irrf?.aplicavel !== false),
      legislacao: 'RIR/2018, Art. 714',
    },
    {
      tributo: 'PIS',
      base: ret.pcc?.base,
      aliquota: '0.65%',
      esperado: ret.pcc?.aplicavel ? String(Number(ret.pcc.base || 0) * 0.0065) : '0',
      nfse: ret.pcc?.pis_nfse,
      status: getRetentionStatus(
        ret.pcc?.aplicavel ? Number(ret.pcc.base || 0) * 0.0065 : 0,
        ret.pcc?.pis_nfse,
        ret.pcc?.aplicavel
      ),
      legislacao: 'Lei 10.833/2003, Art. 30',
    },
    {
      tributo: 'COFINS',
      base: ret.pcc?.base,
      aliquota: '3.00%',
      esperado: ret.pcc?.aplicavel ? String(Number(ret.pcc.base || 0) * 0.03) : '0',
      nfse: ret.pcc?.cofins_nfse,
      status: getRetentionStatus(
        ret.pcc?.aplicavel ? Number(ret.pcc.base || 0) * 0.03 : 0,
        ret.pcc?.cofins_nfse,
        ret.pcc?.aplicavel
      ),
      legislacao: 'Lei 10.833/2003, Art. 30',
    },
    {
      tributo: 'CSLL',
      base: ret.pcc?.base,
      aliquota: '1.00%',
      esperado: ret.pcc?.aplicavel ? String(Number(ret.pcc.base || 0) * 0.01) : '0',
      nfse: ret.pcc?.csll_nfse,
      status: getRetentionStatus(
        ret.pcc?.aplicavel ? Number(ret.pcc.base || 0) * 0.01 : 0,
        ret.pcc?.csll_nfse,
        ret.pcc?.aplicavel
      ),
      legislacao: 'Lei 10.833/2003, Art. 30',
    },
    {
      tributo: 'INSS',
      base: ret.inss?.base,
      aliquota: ret.inss?.aplicavel ? '11.00%' : '-',
      esperado: ret.inss?.valor_esperado,
      nfse: ret.inss?.valor_nfse,
      status: getRetentionStatus(ret.inss?.valor_esperado, ret.inss?.valor_nfse, ret.inss?.aplicavel),
      legislacao: 'IN RFB 2.110/2022',
    },
    {
      tributo: 'ISS',
      base: ret.iss?.base,
      aliquota: ret.iss?.aliquota ? `${ret.iss.aliquota}%` : '-',
      esperado: ret.iss?.valor_esperado,
      nfse: ret.iss?.valor_nfse,
      status: getRetentionStatus(ret.iss?.valor_esperado, ret.iss?.valor_nfse, true),
      legislacao: 'LC 116/2003',
      extra: ret.iss?.retido_tomador ? 'Retido pelo tomador' : null,
    },
  ].map((r) => ({
    ...r,
    fundamentacoes: fundamentacoesFor(analysis, r.tributo),
    feedback: feedbackPorTributo[getFeedbackTributo(r.tributo)] || null,
  }))

  // Chaves de feedback dos tributos aplicáveis (uma por chave: PIS/COFINS/
  // CSLL viram uma só entrada PCC) e quantas já foram tratadas.
  const chavesAplicaveis = [...new Set(
    rows.filter((r) => r.status !== 'na' && r.status !== 'dispensado').map((r) => getFeedbackTributo(r.tributo))
  )]
  const tratados = chavesAplicaveis.filter((k) => feedbackPorTributo[k]).length

  // Per-invoice feedback: approve all retentions at once
  const handleApproveAll = async () => {
    if (!invoiceId) return
    try {
      setSubmitting(true)
      // 25/09: "Confirmar" depois de corrigir confirma SÓ o que não foi
      // corrigido — motor_acertou=true num tributo corrigido gravaria um
      // "acertou" por cima da correção. Lista vazia (tudo corrigido) ainda
      // escritura: é o analista declarando que a revisão terminou (NFSC-03).
      const chaves = chavesParaConfirmar(chavesAplicaveis, feedbackPorTributo)
      const feedbacks = chaves.map((tributo) => ({
        tributo,
        motor_acertou: true,
        correcoes: null,
        comment: null,
      }))
      const res = await api.submitNfseFeedback(invoiceId, feedbacks)
      const em = new Date().toISOString()
      marcarLocal(Object.fromEntries(chaves.map((k) => [k, { tipo: 'confirmado', valores: null, em }])))
      invalidateAposFeedback()
      // O backend recusa escriturar nota com veredito BLOQUEADO/CRITICO — o
      // feedback foi registrado, mas a nota NAO ficou escriturada. Dizer isso.
      setSubmitResult(res?.escrituracao_recusada
        ? {
            type: 'error',
            message: `Feedback registrado, mas a nota esta ${res.escrituracao_recusada}: `
              + 'resolva o bloqueio formal antes de escriturar.',
          }
        : { type: 'success', message: 'Analise confirmada — nota escriturada' })
    } catch {
      setSubmitResult({ type: 'error', message: 'Erro ao enviar confirmacao' })
    } finally {
      setSubmitting(false)
      setTimeout(() => setSubmitResult(null), 4000)
    }
  }

  // Submit das correções do modal (N feedbacks numa chamada, T21). Não fecha
  // a nota: "Corrigir" e "Confirmar Analise" continuam disponíveis para
  // corrigir o próximo tributo na mesma sessão (NFSC-01/03).
  const handleCorrectionSubmit = async (feedbacks) => {
    setCorrectionModal(false)
    if (!invoiceId || feedbacks.length === 0) return
    try {
      setSubmitting(true)
      await api.submitNfseFeedback(invoiceId, feedbacks)
      const em = new Date().toISOString()
      marcarLocal(Object.fromEntries(
        feedbacks.map((f) => [f.tributo, { tipo: 'corrigido', valores: f.correcoes, em }])
      ))
      invalidateAposFeedback()
      setSubmitResult({ type: 'success', message: `${feedbacks.map((f) => f.tributo).join(', ')}: correcao enviada` })
    } catch {
      setSubmitResult({ type: 'error', message: `Erro ao enviar correcao` })
    } finally {
      setSubmitting(false)
      setTimeout(() => setSubmitResult(null), 4000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Submit feedback toast */}
      {submitResult && (
        <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
          submitResult.type === 'success'
            ? 'bg-success-subtle text-success-text border border-success-border'
            : 'bg-destructive-subtle text-destructive-text border border-destructive-border'
        }`}>
          {submitResult.message}
        </div>
      )}

      {/* Classification Summary */}
      <div className="bg-info-subtle border border-info-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-info-text">Classificacao do Servico</h3>
          {precedenteId != null && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setShowPrecedentesPanel(true)}
                  className="rounded-full font-semibold bg-warning-subtle text-warning-text border-warning-border hover:bg-warning-subtle hover:text-warning-text hover:opacity-80"
                >
                  <Scale className="w-3 h-3" /> PRECEDENTE
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                Uma ou mais retencoes desta nota vieram de um precedente NFS-e vigente. Clique para ver e, se necessario, revogar.
              </TooltipContent>
            </Tooltip>
          )}
          {groundTruthSemPrecedente && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="gap-1.5 rounded-full font-semibold cursor-help">
                  <Scale className="w-3 h-3" /> AJUSTE POR FEEDBACK
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                Retencoes ajustadas por feedback humano agregado deste prestador (ground truth legado). Nao ha precedente revogavel associado.
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-info-text">Codigo LC 116:</span>{' '}
            <span className="font-mono font-semibold text-info-text">{cls.codigo_servico || '-'}</span>
          </div>
          <div>
            <span className="text-info-text">Grupo:</span>{' '}
            <span className="font-medium text-info-text whitespace-pre-wrap">{invoice.discriminacao_servico || cls.descricao_servico || '-'}</span>
          </div>
          <div>
            <span className="text-info-text">Regime Prestador:</span>{' '}
            <span className="font-medium text-info-text">
              {cls.is_simples ? 'Simples Nacional' : cls.is_mei ? 'MEI' : cls.is_pf ? 'Pessoa Fisica' : cls.regime_prestador || '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Retention Table */}
      <Table className="min-w-full divide-y divide-border text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 py-3 text-left font-semibold text-foreground h-auto">Tributo</TableHead>
              <TableHead className="px-4 py-3 text-right font-semibold text-foreground h-auto">Base Calculo</TableHead>
              <TableHead className="px-4 py-3 text-right font-semibold text-foreground h-auto">Aliquota</TableHead>
              <TableHead className="px-4 py-3 text-right font-semibold text-foreground h-auto">Esperado</TableHead>
              <TableHead className="px-4 py-3 text-right font-semibold text-foreground h-auto">NFS-e</TableHead>
              <TableHead className="px-4 py-3 text-center font-semibold text-foreground h-auto">Status</TableHead>
              <TableHead className="px-4 py-3 text-left font-semibold text-foreground h-auto">Legislacao</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-card divide-y divide-border">
            {rows.map((row) => (
              <TableRow
                key={row.tributo}
                className={
                  row.status === 'divergente' ? 'bg-warning-subtle' :
                  row.status === 'ausente' ? 'bg-destructive-subtle' :
                  row.status === 'ok' ? 'bg-success-subtle' : ''
                }
              >
                <TableCell className="px-4 py-3 font-semibold text-foreground">
                  {row.tributo}
                  {row.feedback && <FeedbackBadge feedback={row.feedback} />}
                </TableCell>
                <TableCell className="px-4 py-3 text-right font-mono text-foreground">{formatCurrency(row.base)}</TableCell>
                <TableCell className="px-4 py-3 text-right font-mono text-foreground">{row.aliquota}</TableCell>
                <TableCell className="px-4 py-3 text-right font-mono font-semibold text-foreground">{formatCurrency(row.esperado)}</TableCell>
                <TableCell className="px-4 py-3 text-right font-mono text-foreground">{formatCurrency(row.nfse)}</TableCell>
                <TableCell className="px-4 py-3 text-center">
                  <StatusLabel status={row.status} />
                  {row.extra && <span className="block text-xs text-muted-foreground mt-0.5">{row.extra}</span>}
                </TableCell>
                <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                  {row.legislacao}
                  <FundamentacaoExpander fundamentacoes={row.fundamentacoes} />
                </TableCell>
              </TableRow>
            ))}
            {/*
              Reforma tributária (IBS/CBS) — puramente informativo. Linhas
              read-only: sem status de conformidade, sem botão Corrigir, sem
              participar do feedback/alertas. Só aparecem quando o layout
              nacional trouxe os valores (grupo IBSCBS).
            */}
            {(invoice?.valor_ibs != null || invoice?.valor_cbs != null) && (
              <>
                {invoice?.valor_ibs != null && (
                  <TableRow className="bg-muted/60 hover:bg-muted/60">
                    <TableCell className="px-4 py-3 font-semibold text-muted-foreground">IBS (reforma — informativo)</TableCell>
                    <TableCell className="px-4 py-3 text-right font-mono text-muted-foreground">-</TableCell>
                    <TableCell className="px-4 py-3 text-right font-mono text-muted-foreground">-</TableCell>
                    <TableCell className="px-4 py-3 text-right font-mono text-muted-foreground">-</TableCell>
                    <TableCell className="px-4 py-3 text-right font-mono text-muted-foreground">{formatCurrency(invoice.valor_ibs)}</TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <Badge variant="secondary">Informativo</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-muted-foreground whitespace-normal">
                      Reforma tributária (EC 132/2023) — não consumido pelo motor
                    </TableCell>
                  </TableRow>
                )}
                {invoice?.valor_cbs != null && (
                  <TableRow className="bg-muted/60 hover:bg-muted/60">
                    <TableCell className="px-4 py-3 font-semibold text-muted-foreground">CBS (reforma — informativo)</TableCell>
                    <TableCell className="px-4 py-3 text-right font-mono text-muted-foreground">-</TableCell>
                    <TableCell className="px-4 py-3 text-right font-mono text-muted-foreground">-</TableCell>
                    <TableCell className="px-4 py-3 text-right font-mono text-muted-foreground">-</TableCell>
                    <TableCell className="px-4 py-3 text-right font-mono text-muted-foreground">{formatCurrency(invoice.valor_cbs)}</TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <Badge variant="secondary">Informativo</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-muted-foreground whitespace-normal">
                      Reforma tributária (EC 132/2023) — não consumido pelo motor
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>

      {/* Valor Liquido Summary */}
      {analysis.valor_liquido && (
        <div className="bg-muted border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Valor Liquido</h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="bg-card rounded-lg p-3 border border-border">
              <span className="text-muted-foreground block text-xs mb-1">Valor Bruto</span>
              <span className="font-mono font-semibold text-foreground">{formatCurrency(analysis.valor_liquido.valor_bruto)}</span>
            </div>
            <div className="bg-card rounded-lg p-3 border border-border">
              <span className="text-muted-foreground block text-xs mb-1">(-) Deducoes</span>
              <span className="font-mono font-semibold text-destructive-text">{formatCurrency(analysis.valor_liquido.valor_deducoes)}</span>
            </div>
            <div className="bg-card rounded-lg p-3 border border-border">
              <span className="text-muted-foreground block text-xs mb-1">(-) Retencoes</span>
              <span className="font-mono font-semibold text-destructive-text">{formatCurrency(analysis.valor_liquido.total_retencoes)}</span>
            </div>
            <div className="bg-primary/5 rounded-lg p-3 border-2 border-primary/20">
              <span className="text-primary block text-xs mb-1 font-medium">= Valor Liquido</span>
              <span className="font-mono font-semibold text-primary text-lg">{formatCurrency(analysis.valor_liquido.valor_liquido)}</span>
            </div>
          </div>
        </div>
      )}

      {/* DARF Suggestions */}
      {analysis.darf_suggestions?.length > 0 && (
        <div className="bg-info-subtle border border-info-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-info-text mb-2">Guias de Recolhimento (DARF)</h3>
          <div className="space-y-2">
            {analysis.darf_suggestions.map((darf, i) => (
              <div key={i} className="flex items-center justify-between bg-card rounded-lg px-3 py-2 border border-info-border">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-info text-info-foreground font-mono">
                    {darf.codigo_darf}
                  </span>
                  <span className="text-sm text-foreground">{darf.tributo}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-semibold text-foreground">{formatCurrency(darf.valor)}</span>
                  <span className="block text-xs text-muted-foreground">{darf.vencimento}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Divergences */}
      {analysis.divergencias?.length > 0 && (
        <div className="bg-warning-subtle border border-warning-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-warning-text mb-2">Divergencias Encontradas</h3>
          <ul className="space-y-1">
            {analysis.divergencias.map((d, i) => (
              <li key={i} className="text-sm text-warning-text flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-warning-text shrink-0 mt-0.5" />
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Per-Invoice Feedback — Approve or Correct the entire analysis */}
      <div className="border border-border rounded-lg p-4 bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Feedback da Analise</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              A analise de retencoes desta NFS-e esta correta?
            </p>
          </div>
          {/*
            Os dois botões ficam SEMPRE disponíveis (NFSC-01/03): corrigir um
            tributo não fecha a nota, e confirmar depois de corrigir é o que
            encerra a revisão. O que já foi tratado aparece no badge da linha.
          */}
          <div className="flex items-center gap-2">
            {tratados > 0 && (
              <span className="text-xs text-muted-foreground mr-1">
                {tratados} de {chavesAplicaveis.length} tributos tratados
              </span>
            )}
            <Button
              variant="success"
              onClick={handleApproveAll}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
              Confirmar Analise
            </Button>
            <Button
              variant="outline"
              onClick={() => setCorrectionModal(true)}
              disabled={submitting}
              className="border-destructive-border text-destructive-text hover:bg-destructive-subtle"
            >
              <ThumbsDown className="w-4 h-4" />
              Corrigir
            </Button>
          </div>
        </div>

      </div>

      {/* Correction Modal */}
      {correctionModal && (
        <CorrectionModal
          rows={rows}
          onClose={() => setCorrectionModal(false)}
          onSubmit={handleCorrectionSubmit}
        />
      )}

      {/* Precedentes NFS-e do prestador (U1) */}
      <NfsePrecedentesPanel
        open={showPrecedentesPanel}
        onClose={() => setShowPrecedentesPanel(false)}
        companyId={invoice?.company_id}
        prestadorCnpj={invoice?.emit_cnpj}
        highlightPrecedenteId={precedenteId}
        canRevogar={canRevogarPrecedente}
        onRevogar={handleRevogarPrecedente}
      />

      {/* Revoke Precedente Modal */}
      <RevokeNfsePrecedenteModal
        target={revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onRevoked={handleRevoked}
      />
    </div>
  )
}
