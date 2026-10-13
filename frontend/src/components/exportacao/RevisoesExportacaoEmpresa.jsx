import React, { useState } from 'react'
import { AlertCircle, CheckCircle2, Clock, FileCheck, FileSearch } from 'lucide-react'
import { DecisaoRevisaoModal } from './DecisaoRevisaoModal'
import {
  GATILHO_REVISAO,
  STATUS_REVISAO,
  ehAberta,
  formatData,
  formatValorMoeda,
  tomadorDaNota,
} from './revisaoLabels'
import {
  Badge,
  Button,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@bhubai/bhub-design-system'

// Contagem regressiva em dias úteis vem do servidor (Revisão AC6); a cor só destaca.
export function PrazoBadge({ rev }) {
  if (!ehAberta(rev)) {
    return <span className="text-muted-foreground text-[11px]">{formatData(rev.decidida_em)}</span>
  }
  const dias = rev.dias_uteis_restantes
  const variant =
    rev.status === 'EXPIRADA' || dias <= 0
      ? 'destructive'
      : dias <= 2
      ? 'warning'
      : 'success'
  const texto =
    rev.status === 'EXPIRADA'
      ? 'prazo vencido'
      : dias == null
      ? formatData(rev.prazo)
      : dias === 1
      ? '1 dia útil'
      : `${dias} dias úteis`
  return (
    <Badge variant={variant} title={`Prazo ${formatData(rev.prazo)} · corte ${formatData(rev.corte)}`}>
      <Clock className="w-3 h-3" />
      {texto}
    </Badge>
  )
}

export function StatusBadge({ rev }) {
  const variantes = {
    PENDENTE: 'info',
    EXPIRADA: 'destructive',
    DECIDIDA_EXPORTACAO: 'success',
    DECIDIDA_INTERNO: 'secondary',
  }
  return (
    <Badge variant={variantes[rev.status] || 'secondary'}>
      {STATUS_REVISAO[rev.status] || rev.status}
    </Badge>
  )
}

export function feedbackDecisao(resultado) {
  const base = `Nota #${resultado.invoice_id} decidida: ${STATUS_REVISAO[resultado.status] || resultado.status}.`
  return resultado.pendencia_retificacao_id
    ? `${base} Decisão depois do corte: pendência de retificação #${resultado.pendencia_retificacao_id} aberta para a operação.`
    : base
}

/**
 * Revisões de exportação da empresa na aba Parâmetros (Tela AC1).
 * `revisoes` são RevisaoItemOut[] já ordenadas por prazo pelo servidor.
 */
export function RevisoesExportacaoEmpresa({ revisoes = [], empresaNome, onDecidir, loading = false }) {
  const [selecionada, setSelecionada] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const abertas = revisoes.filter(ehAberta)

  const fechar = (resultado) => {
    setSelecionada(null)
    if (resultado) setFeedback({ type: 'success', text: feedbackDecisao(resultado) })
  }

  return (
    <Card padding="none" className="gap-0 overflow-hidden mb-6">
      <div className="px-6 py-4 bg-muted border-b border-border flex items-center gap-2.5">
        <div className="p-2 bg-info-subtle text-info-text rounded-md">
          <FileSearch className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Revisões de exportação</h3>
            <Badge variant="info">
              {abertas.length} {abertas.length === 1 ? 'aberta' : 'abertas'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Notas que declararam exportação sem cadastro: decidir até o prazo (corte − 2 dias úteis)
          </p>
        </div>
      </div>

      {feedback && (
        <div className={`mx-6 mt-4 p-3 rounded-md text-xs flex items-center gap-2 ${feedback.type === 'success' ? 'bg-success-subtle text-success-text border border-success-border' : 'bg-destructive-subtle text-destructive-text border border-destructive-border'}`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="p-6">
        {revisoes.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            {loading ? 'Carregando revisões...' : 'Nenhuma revisão de exportação nesta competência.'}
          </p>
        ) : (
          <div className="overflow-x-auto border border-border rounded-md">
            <Table className="text-left text-xs bg-card">
              <TableHeader>
                <TableRow className="bg-muted hover:bg-muted">
                  <TableHead className="px-4 py-3 h-auto font-semibold uppercase tracking-wider text-muted-foreground">Prazo</TableHead>
                  <TableHead className="px-4 py-3 h-auto font-semibold uppercase tracking-wider text-muted-foreground">Nota</TableHead>
                  <TableHead className="px-4 py-3 h-auto font-semibold uppercase tracking-wider text-muted-foreground">Gatilho</TableHead>
                  <TableHead className="px-4 py-3 h-auto font-semibold uppercase tracking-wider text-muted-foreground">Tomador / País</TableHead>
                  <TableHead className="px-3 py-3 h-auto font-semibold uppercase tracking-wider text-muted-foreground">Subitem</TableHead>
                  <TableHead className="px-4 py-3 h-auto font-semibold uppercase tracking-wider text-muted-foreground">Moeda</TableHead>
                  <TableHead className="px-4 py-3 h-auto font-semibold uppercase tracking-wider text-muted-foreground">Situação</TableHead>
                  <TableHead className="px-4 py-3 text-right h-auto font-semibold uppercase tracking-wider text-muted-foreground">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revisoes.map((rev) => {
                  const tomador = tomadorDaNota(rev.valores_nota)
                  return (
                    <TableRow key={rev.id} className="hover:bg-muted">
                      <TableCell className="px-4 py-3 whitespace-nowrap"><PrazoBadge rev={rev} /></TableCell>
                      <TableCell className="px-4 py-3 font-mono font-semibold text-foreground whitespace-nowrap">#{rev.invoice_id}</TableCell>
                      <TableCell className="px-4 py-3 text-foreground">{GATILHO_REVISAO[rev.gatilho] || rev.gatilho}</TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="font-medium text-foreground">{tomador.nome}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">{tomador.pais}{tomador.doc ? ` · ${tomador.doc}` : ''}</div>
                      </TableCell>
                      <TableCell className="px-3 py-3 font-mono font-semibold text-foreground whitespace-nowrap">{rev.valores_nota?.codigo_servico_lc116 || '—'}</TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap text-foreground">{formatValorMoeda(rev.valores_nota)}</TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge rev={rev} />
                        {rev.decidida_por && <div className="text-[10px] text-muted-foreground mt-0.5">por {rev.decidida_por}</div>}
                      </TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap text-right">
                        {ehAberta(rev) && (
                          <Button type="button" variant="info" size="sm" onClick={() => setSelecionada(rev)} disabled={loading}>
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Decidir</span>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {selecionada && (
        <DecisaoRevisaoModal revisao={selecionada} empresaNome={empresaNome} onDecidir={onDecidir} onClose={fechar} />
      )}
    </Card>
  )
}

export default RevisoesExportacaoEmpresa
