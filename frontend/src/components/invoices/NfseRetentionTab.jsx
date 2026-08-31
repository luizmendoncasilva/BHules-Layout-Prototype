import { useState } from 'react'
import { CheckCircle, AlertTriangle, XCircle, ThumbsUp, ThumbsDown, Send, Loader2, Check } from 'lucide-react'
import {
  Button, Badge, Input, Textarea,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@bhubai/bhub-design-system'
import { api } from '../../api/client'

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

function CorrectionModal({ row, onClose, onSubmit }) {
  const [aliquota, setAliquota] = useState('')
  const [valor, setValor] = useState('')
  const [base, setBase] = useState('')
  const [comment, setComment] = useState('')

  const handleSubmit = () => {
    const correcoes = {}
    if (aliquota !== '') correcoes.aliquota = parseFloat(aliquota)
    if (valor !== '') correcoes.valor = parseFloat(valor)
    if (base !== '') correcoes.base = parseFloat(base)
    onSubmit({
      tributo: getFeedbackTributo(row.tributo),
      motor_acertou: false,
      correcoes: Object.keys(correcoes).length > 0 ? correcoes : null,
      comment: comment || null,
    })
  }

  return (
    <Sheet open={!!row} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent side="right" className="p-0 gap-0 flex flex-col">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Corrigir {row.tributo}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5">
        <p className="text-sm text-muted-foreground mb-4">
          Informe os valores corretos. Deixe em branco os campos que o motor acertou.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Base de Calculo (R$)</label>
            <Input
              type="number"
              step="0.01"
              value={base}
              onChange={(e) => setBase(e.target.value)}
              placeholder={row.base != null ? String(row.base) : ''}
              className="font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Aliquota (%)</label>
            <Input
              type="number"
              step="0.01"
              value={aliquota}
              onChange={(e) => setAliquota(e.target.value)}
              placeholder={row.aliquota !== '-' ? row.aliquota.replace('%', '') : ''}
              className="font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Valor Correto (R$)</label>
            <Input
              type="number"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder={row.esperado != null ? String(Number(row.esperado).toFixed(2)) : ''}
              className="font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Comentario (opcional)</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="Ex: Aliquota correta conforme LC 116 item 7.02"
              className="resize-none"
            />
          </div>
        </div>
        </div>
        <SheetFooter className="flex-row justify-end gap-2 border-t border-border shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            <Send className="w-4 h-4" />
            Enviar Correcao
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default function NfseRetentionTab({ analysis, invoiceId }) {
  const [correctionModal, setCorrectionModal] = useState(null) // row object or null
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState(null)
  const [invoiceFeedback, setInvoiceFeedback] = useState(null) // 'up' | 'down' | null
  const [showCorrectionPanel, setShowCorrectionPanel] = useState(false)

  if (!analysis) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        Execute a validacao NFS-e para ver a analise de retencoes
      </div>
    )
  }

  const ret = analysis.retencoes || {}
  const cls = analysis.classification || {}

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
  ]

  // Per-invoice feedback: approve all retentions at once
  const handleApproveAll = async () => {
    if (!invoiceId) return
    try {
      setSubmitting(true)
      const feedbacks = rows
        .filter((r) => r.status !== 'na' && r.status !== 'dispensado')
        .map((r) => ({
          tributo: getFeedbackTributo(r.tributo),
          motor_acertou: true,
          correcoes: null,
          comment: null,
        }))
      await api.submitNfseFeedback(invoiceId, feedbacks)
      setInvoiceFeedback('up')
      setSubmitResult({ type: 'success', message: 'Analise confirmada — feedback registrado para todos os tributos' })
    } catch {
      setSubmitResult({ type: 'error', message: 'Erro ao enviar confirmacao' })
    } finally {
      setSubmitting(false)
      setTimeout(() => setSubmitResult(null), 4000)
    }
  }

  // Per-invoice reject: open correction panel
  const handleRejectAnalysis = () => {
    setShowCorrectionPanel(true)
  }

  // Submit correction for a specific tributo (from correction panel)
  const handleCorrectionSubmit = async (feedback) => {
    setCorrectionModal(null)
    if (!invoiceId) return
    try {
      setSubmitting(true)
      await api.submitNfseFeedback(invoiceId, [feedback])
      setInvoiceFeedback('down')
      setSubmitResult({ type: 'success', message: `${feedback.tributo}: correcao enviada` })
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
        <h3 className="text-sm font-semibold text-info-text mb-2">Classificacao do Servico</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-info-text">Codigo LC 116:</span>{' '}
            <span className="font-mono font-semibold text-info-text">{cls.codigo_servico || '-'}</span>
          </div>
          <div>
            <span className="text-info-text">Grupo:</span>{' '}
            <span className="font-medium text-info-text">{cls.descricao_servico || '-'}</span>
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
                <TableCell className="px-4 py-3 font-semibold text-foreground">{row.tributo}</TableCell>
                <TableCell className="px-4 py-3 text-right font-mono text-foreground">{formatCurrency(row.base)}</TableCell>
                <TableCell className="px-4 py-3 text-right font-mono text-foreground">{row.aliquota}</TableCell>
                <TableCell className="px-4 py-3 text-right font-mono font-semibold text-foreground">{formatCurrency(row.esperado)}</TableCell>
                <TableCell className="px-4 py-3 text-right font-mono text-foreground">{formatCurrency(row.nfse)}</TableCell>
                <TableCell className="px-4 py-3 text-center">
                  <StatusLabel status={row.status} />
                  {row.extra && <span className="block text-xs text-muted-foreground mt-0.5">{row.extra}</span>}
                </TableCell>
                <TableCell className="px-4 py-3 text-xs text-muted-foreground">{row.legislacao}</TableCell>
              </TableRow>
            ))}
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
          <div className="flex items-center gap-2">
            {invoiceFeedback === 'up' ? (
              <Badge variant="success" className="px-3 py-1.5 text-sm">
                <Check className="w-4 h-4" /> Confirmada
              </Badge>
            ) : invoiceFeedback === 'down' ? (
              <Badge variant="warning" className="px-3 py-1.5 text-sm">
                <AlertTriangle className="w-4 h-4" /> Correcao enviada
              </Badge>
            ) : (
              <>
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
                  onClick={handleRejectAnalysis}
                  disabled={submitting}
                  className="border-destructive-border text-destructive-text hover:bg-destructive-subtle"
                >
                  <ThumbsDown className="w-4 h-4" />
                  Corrigir
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Correction panel: select which tributo to correct */}
        {showCorrectionPanel && !invoiceFeedback && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">Selecione o tributo a corrigir:</p>
            <div className="flex flex-wrap gap-2">
              {rows
                .filter((r) => r.status !== 'na' && r.status !== 'dispensado')
                .map((r) => (
                  <Button
                    key={r.tributo}
                    variant="outline"
                    size="sm"
                    onClick={() => setCorrectionModal(r)}
                  >
                    {r.tributo}
                  </Button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Correction Modal */}
      {correctionModal && (
        <CorrectionModal
          row={correctionModal}
          onClose={() => setCorrectionModal(null)}
          onSubmit={handleCorrectionSubmit}
        />
      )}
    </div>
  )
}
