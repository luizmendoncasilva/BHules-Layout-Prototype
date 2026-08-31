import { useState, useRef, useCallback, useEffect } from 'react'
import { PanelRightClose, Copy, FileText, ChevronDown, Check, ShieldAlert, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react'
import {
  Sheet, SheetContent, Button, IconButton,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@bhubai/bhub-design-system'
import { useInvoiceItems, useStatusReasons } from '../../hooks/useInvoices'
import { useValidationAnalysis } from '../../hooks/useValidation'
import StatusBadge from '../shared/StatusBadge'

/* ── helpers ──────────────────────────────────────────────────────── */

function formatCurrency(val) {
  if (val == null) return '-'
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(val) {
  if (!val) return '-'
  return new Date(val + 'T00:00:00').toLocaleDateString('pt-BR')
}

function formatQty(val) {
  if (val == null) return '-'
  return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const freteLabels = {
  '0': '0 - Emitente',
  '1': '1 - Destinatário',
  '2': '2 - Terceiros',
  '9': '9 - Sem Transporte',
}

/* ── Tax table ────────────────────────────────────────────────────── */

function TaxRow({ label, base, valor, isSection }) {
  if (isSection) {
    return (
      <TableRow className="border-0">
        <TableCell
          className="px-3 py-0 h-8 whitespace-normal text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border bg-muted"
          colSpan={3}
        >
          {label}
        </TableCell>
      </TableRow>
    )
  }
  return (
    <TableRow className="border-0 hover:bg-muted">
      <TableCell className="px-3 py-0 h-10 whitespace-normal text-sm font-medium text-foreground border-r border-b border-border bg-card w-32">
        {label}
      </TableCell>
      <TableCell className="px-3 py-0 h-10 whitespace-normal text-sm text-foreground border-r border-b border-border bg-card text-right w-40">
        {base != null ? <span>{formatCurrency(base)}</span> : <span className="text-muted-foreground">-</span>}
      </TableCell>
      <TableCell className="px-3 py-0 h-10 whitespace-normal text-sm text-foreground border-b border-border bg-card text-right">
        {valor != null ? <span>{formatCurrency(valor)}</span> : <span className="text-muted-foreground">-</span>}
      </TableCell>
    </TableRow>
  )
}

function TaxTable({ invoice }) {
  const rows = [
    { label: 'ICMS', base: invoice.vl_bc_icms, valor: invoice.vl_icms },
    { label: 'ICMS ST', base: invoice.vl_bc_icms_st, valor: invoice.vl_icms_st },
    { label: 'IPI', base: null, valor: invoice.vl_ipi },
    { label: 'PIS', base: null, valor: invoice.vl_pis },
    { label: 'COFINS', base: null, valor: invoice.vl_cofins },
    { label: 'ISS', base: null, valor: invoice.vl_iss },
    { label: 'Reforma Tributária', isSection: true },
    { label: 'CBS', base: null, valor: invoice.vl_cbs },
    { label: 'IBS UF', base: null, valor: invoice.vl_ibs_uf },
    { label: 'IBS Mun.', base: null, valor: invoice.vl_ibs_mun },
  ]

  return (
    <div>
      <h3 className="text-sm font-medium text-foreground mb-2">Impostos</h3>
      <Table className="w-full text-sm border-collapse">
        <TableHeader>
          <TableRow className="border-0 bg-muted">
            <TableHead className="text-left px-3 py-0 h-10 whitespace-normal text-sm font-medium text-muted-foreground border-r border-b border-border w-32">Imposto</TableHead>
            <TableHead className="text-right px-3 py-0 h-10 whitespace-normal text-sm font-medium text-muted-foreground border-r border-b border-border w-40">Base de Cálculo</TableHead>
            <TableHead className="text-right px-3 py-0 h-10 whitespace-normal text-sm font-medium text-muted-foreground border-b border-border">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <TaxRow key={i} {...r} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

/* ── Info table ────────────────────────────────────────────────────── */

function InfoTable({ invoice, items }) {
  const cfops = [...new Set((items || []).map((it) => it.cfop_emitente).filter(Boolean))]

  return (
    <Table className="w-full text-sm border-collapse">
      <TableBody>
        <TableRow className="border-0 hover:bg-muted">
          <TableCell className="px-3 py-0 h-10 whitespace-normal text-sm font-medium text-muted-foreground border-r border-b border-border bg-card w-52 min-w-52">
            Modalidade de Transporte
          </TableCell>
          <TableCell className="px-3 py-0 h-10 whitespace-pre-wrap text-sm font-normal text-foreground border-b border-border bg-card">
            {freteLabels[invoice.ind_frt] || invoice.ind_frt || '-'}
          </TableCell>
        </TableRow>
        <TableRow className="border-0 hover:bg-muted">
          <TableCell className="px-3 py-0 h-10 whitespace-normal text-sm font-medium text-muted-foreground border-r border-b border-border bg-card w-52 min-w-52">
            CFOPs
          </TableCell>
          <TableCell className="px-3 py-0 h-10 whitespace-pre-wrap text-sm font-normal text-foreground border-b border-border bg-card">
            {cfops.length > 0 ? cfops.join(', ') : '-'}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
}

/* ── Product accordion ────────────────────────────────────────────── */

function ProductItem({ item, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)
  const unitVal = item.vl_un_com || (item.qtd ? item.vl_item / item.qtd : 0)

  const fields = [
    { label: 'Item', value: item.num_item },
    { label: 'Código', value: item.cod_item },
    { label: 'Descrição', value: item.descr_compl },
    { label: 'NCM', value: item.ncm },
    { label: 'CFOP', value: item.cfop_emitente },
    { label: 'Unidade', value: item.unid },
    { label: 'Quantidade', value: formatQty(item.qtd) },
    { label: 'Valor Unitário', value: formatCurrency(unitVal) },
    { label: 'Valor Total', value: formatCurrency(item.vl_item) },
  ]

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 bg-muted hover:bg-accent transition-colors cursor-pointer"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <ChevronDown
            className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-150 ease-in-out ${open ? '-rotate-180' : 'rotate-0'}`}
          />
          <span className="text-base font-semibold leading-6 text-foreground truncate">
            {item.cod_item || '-'} - {item.descr_compl || '-'}
          </span>
        </div>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-150 ease-in-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="bg-card">
            <Table className="w-full text-sm border-collapse">
              <TableBody>
                {fields.map((f, i) => (
                  <TableRow key={i} className="border-0 hover:bg-muted">
                    <TableCell className="px-3 py-0 h-10 whitespace-normal text-sm font-medium text-muted-foreground border-r border-b border-border bg-card w-40 min-w-40">
                      {f.label}
                    </TableCell>
                    <TableCell className="px-3 py-0 h-10 whitespace-normal text-sm font-normal text-foreground border-b border-border bg-card">
                      {f.value || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Analysis Summary ─────────────────────────────────────────────── */

const scoreConfig = {
  APROVADA: { bg: 'bg-success-subtle', border: 'border-success-border', text: 'text-success-text', label: 'Aprovada', icon: CheckCircle, iconColor: 'text-success-text' },
  REVISAO_LEVE: { bg: 'bg-warning-subtle', border: 'border-warning-border', text: 'text-warning-text', label: 'Revisão Leve', icon: AlertTriangle, iconColor: 'text-warning-text' },
  REVISAO_OBRIGATORIA: { bg: 'bg-warning-subtle', border: 'border-warning-border', text: 'text-warning-text', label: 'Revisão Obrigatória', icon: AlertTriangle, iconColor: 'text-warning-text' },
  BLOQUEADA_POR_SCORE: { bg: 'bg-destructive-subtle', border: 'border-destructive-border', text: 'text-destructive-text', label: 'Bloqueada', icon: XCircle, iconColor: 'text-destructive-text' },
  BLOQUEADA_GATE: { bg: 'bg-destructive-subtle', border: 'border-destructive-border', text: 'text-destructive-text', label: 'Bloqueada (Gate)', icon: ShieldAlert, iconColor: 'text-destructive-text' },
}

function AnalysisSummary({ analysis }) {
  if (!analysis || analysis.doc_score == null) return null

  const sc = scoreConfig[analysis.score_classification] || scoreConfig.REVISAO_LEVE
  const Icon = sc.icon
  const rn = analysis.resultado_nota_v4 || {}

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold leading-7 text-foreground">
        Resultado da análise
      </h3>

      <div className={`rounded-lg border ${sc.border} ${sc.bg} p-4`}>
        <div className="flex items-center gap-3 mb-3">
          <Icon className={`h-5 w-5 ${sc.iconColor}`} />
          <span className={`text-base font-semibold ${sc.text}`}>{sc.label}</span>
          <span className={`ml-auto font-mono text-lg font-semibold ${sc.text}`}>{analysis.doc_score}</span>
        </div>

        {rn.total_itens != null && (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between px-2 py-1 bg-card/60 rounded">
              <span className="text-muted-foreground">Total de itens</span>
              <span className="font-medium text-foreground">{rn.total_itens}</span>
            </div>
            {rn.itens_aprovados > 0 && (
              <div className="flex justify-between px-2 py-1 bg-card/60 rounded">
                <span className="text-success-text">Aprovados</span>
                <span className="font-medium text-success-text">{rn.itens_aprovados}</span>
              </div>
            )}
            {rn.itens_aprovados_ressalva > 0 && (
              <div className="flex justify-between px-2 py-1 bg-card/60 rounded">
                <span className="text-warning-text">Com ressalva</span>
                <span className="font-medium text-warning-text">{rn.itens_aprovados_ressalva}</span>
              </div>
            )}
            {rn.itens_revisao > 0 && (
              <div className="flex justify-between px-2 py-1 bg-card/60 rounded">
                <span className="text-warning-text">Revisão</span>
                <span className="font-medium text-warning-text">{rn.itens_revisao}</span>
              </div>
            )}
            {rn.itens_bloqueados > 0 && (
              <div className="flex justify-between px-2 py-1 bg-card/60 rounded">
                <span className="text-destructive-text">Bloqueados</span>
                <span className="font-medium text-destructive-text">{rn.itens_bloqueados}</span>
              </div>
            )}
            {rn.itens_antecipacao > 0 && (
              <div className="flex justify-between px-2 py-1 bg-card/60 rounded">
                <span className="text-purple-700">Antecipação</span>
                <span className="font-medium text-purple-800">{rn.itens_antecipacao}</span>
              </div>
            )}
          </div>
        )}

        {/* Financial impact */}
        {(rn.valor_total_credito_icms || rn.valor_total_credito_pis || rn.valor_total_credito_cofins) && (
          <div className="mt-3 pt-3 border-t border-current/10">
            <p className="text-xs font-medium text-muted-foreground mb-1">Créditos estimados</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {rn.valor_total_credito_icms != null && (
                <div className="text-center">
                  <div className="font-medium text-foreground">{formatCurrency(rn.valor_total_credito_icms)}</div>
                  <div className="text-muted-foreground">ICMS</div>
                </div>
              )}
              {rn.valor_total_credito_pis != null && (
                <div className="text-center">
                  <div className="font-medium text-foreground">{formatCurrency(rn.valor_total_credito_pis)}</div>
                  <div className="text-muted-foreground">PIS</div>
                </div>
              )}
              {rn.valor_total_credito_cofins != null && (
                <div className="text-center">
                  <div className="font-medium text-foreground">{formatCurrency(rn.valor_total_credito_cofins)}</div>
                  <div className="text-muted-foreground">COFINS</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Alertas nota-level */}
      {rn.alertas_nota && rn.alertas_nota.length > 0 && (
        <div className="space-y-1">
          {rn.alertas_nota.map((alerta, i) => (
            <p key={i} className="text-xs text-warning-text bg-warning-subtle border border-warning-border rounded px-3 py-1.5">
              {alerta}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Status Reasons (shared component) ────────────────────────────── */

import StatusReasons from './StatusReasons'

/* ── Main Sheet ───────────────────────────────────────────────────── */

export default function InvoiceSheet({ invoice, isOpen, onClose, onViewDetails }) {
  const [width, setWidth] = useState(906)
  const [copied, setCopied] = useState(false)
  const dragging = useRef(false)
  const startX = useRef(0)
  const startW = useRef(0)

  const { data: items } = useInvoiceItems(isOpen ? invoice?.id : null)
  const { data: analysis } = useValidationAnalysis(isOpen ? invoice?.id : null)
  const { data: statusReasons } = useStatusReasons(isOpen ? invoice?.id : null)

  // Resize handlers
  const onMouseDown = useCallback((e) => {
    e.preventDefault()
    dragging.current = true
    startX.current = e.clientX
    startW.current = width
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [width])

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragging.current) return
      const diff = startX.current - e.clientX
      const newW = Math.max(400, Math.min(window.innerWidth - 200, startW.current + diff))
      setWidth(newW)
    }
    const onMouseUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  // Copy key
  const handleCopyKey = useCallback(() => {
    if (!invoice?.chave_nfe) return
    navigator.clipboard.writeText(invoice.chave_nfe)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [invoice?.chave_nfe])

  const status = invoice?.analise_status || invoice?.validation_status || 'NAO_VALIDADA'

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="p-0 gap-0 flex flex-col sm:max-w-none border-l"
        style={{ width }}
      >
        {/* Resize handle */}
        <div
          className="absolute left-0 top-0 w-1.5 h-full cursor-col-resize bg-transparent hover:bg-neutral-300 active:bg-neutral-400 transition-colors"
          onMouseDown={onMouseDown}
        />

        {invoice && (
          <div className="flex flex-col h-full">
            {/* ── Header ── */}
            <div className="flex flex-col border-b border-border">
              {/* Close button */}
              <div className="px-6 pt-4">
                <IconButton
                  aria-label="Fechar"
                  variant="ghost"
                  onClick={onClose}
                >
                  <PanelRightClose className="h-5 w-5" />
                </IconButton>
              </div>

              {/* Title + value */}
              <div className="flex items-center justify-between px-6 pt-2">
                <h2 className="text-xl font-semibold truncate">
                  {invoice.emit_razao_social || 'Emitente'}
                </h2>
                <span className="text-xl font-semibold whitespace-nowrap ml-4">
                  {formatCurrency(invoice.vl_doc)}
                </span>
              </div>

              {/* Subtitle + badge */}
              <div className="flex items-center justify-between px-6 pt-1">
                <span className="text-base text-muted-foreground">
                  NFE nº {invoice.num_doc || '-'} &bull; Série {invoice.serie || '1'} &bull; {formatDate(invoice.dt_doc)}
                </span>
                <StatusBadge status={status} />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 items-center px-6 py-4">
                <Button
                  variant="outline"
                  onClick={handleCopyKey}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-success-text" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span>{copied ? 'Copiado!' : 'Copiar chave'}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onViewDetails(invoice)}
                >
                  <FileText className="h-4 w-4" />
                  Ver PDF
                </Button>
              </div>
            </div>

            {/* ── Content ── */}
            <div className="flex-1 overflow-auto">
              <div className="p-4 space-y-4">
                {/* Informações gerais */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold leading-7 text-foreground">
                    Informações gerais
                  </h3>
                  <div className="flex flex-col gap-4">
                    <TaxTable invoice={invoice} />
                    <InfoTable invoice={invoice} items={items} />
                  </div>
                </div>

                {/* Resultado da análise */}
                <AnalysisSummary analysis={analysis} />

                {/* Motivo do status */}
                <StatusReasons data={statusReasons} />

                {/* Informações dos produtos */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold leading-7 text-foreground">
                    Informações dos produtos ({items?.length || 0})
                  </h3>
                  <div className="space-y-3">
                    {(items || []).map((item, i) => (
                      <ProductItem key={item.id || i} item={item} defaultOpen={i === 0} />
                    ))}
                    {(!items || items.length === 0) && (
                      <p className="text-sm text-muted-foreground text-center py-4">Carregando itens...</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="p-6 border-t border-border">
              <Button
                onClick={() => onViewDetails(invoice)}
                className="w-full"
              >
                Ver mais detalhes
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
