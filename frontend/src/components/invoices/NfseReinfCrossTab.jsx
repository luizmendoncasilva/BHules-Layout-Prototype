import { CheckCircle, AlertTriangle, XCircle, FileSearch } from 'lucide-react'
import {
  Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@bhubai/bhub-design-system'

function formatCurrency(val) {
  if (val == null || val === '' || val === '0' || val === 0) return 'R$ 0,00'
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function ComparisonRow({ label, nfseValue, reinfValue }) {
  const nf = Number(nfseValue || 0)
  const rf = Number(reinfValue || 0)
  const diff = Math.abs(nf - rf)
  const isMatch = diff <= 0.10
  const hasData = nf > 0 || rf > 0

  return (
    <TableRow className={hasData && !isMatch ? 'bg-warning-subtle' : hasData && isMatch ? 'bg-success-subtle' : ''}>
      <TableCell className="px-4 py-3 font-medium text-foreground">{label}</TableCell>
      <TableCell className="px-4 py-3 text-right font-mono text-foreground">{formatCurrency(nfseValue)}</TableCell>
      <TableCell className="px-4 py-3 text-right font-mono text-foreground">{formatCurrency(reinfValue)}</TableCell>
      <TableCell className="px-4 py-3 text-right font-mono text-foreground">
        {hasData ? formatCurrency(diff) : '-'}
      </TableCell>
      <TableCell className="px-4 py-3 text-center">
        {!hasData ? (
          <span className="text-muted-foreground text-xs">-</span>
        ) : isMatch ? (
          <Badge variant="success">
            <CheckCircle className="w-3.5 h-3.5" /> OK
          </Badge>
        ) : (
          <Badge variant="warning">
            <AlertTriangle className="w-3.5 h-3.5" /> Diverge
          </Badge>
        )}
      </TableCell>
    </TableRow>
  )
}

export default function NfseReinfCrossTab({ analysis, invoice }) {
  if (!analysis) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        Execute a validacao NFS-e para ver o cruzamento com REINF
      </div>
    )
  }

  const reinf = analysis.reinf || {}
  const r4020 = reinf.r4020
  const r2010 = reinf.r2010
  const ret = analysis.retencoes || {}

  const hasR4020 = r4020 && r4020.eventos > 0
  const hasR2010 = r2010 && r2010.eventos > 0

  return (
    <div className="space-y-6">
      {/* R-4020 Section — IR/PCC */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-muted px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">R-4020 — Retencoes IR/PCC (Pagamentos PJ)</h3>
          </div>
          {hasR4020 ? (
            <Badge variant="success">
              <CheckCircle className="w-3.5 h-3.5" /> {r4020.eventos} evento(s) encontrado(s)
            </Badge>
          ) : (
            <Badge variant="destructive">
              <XCircle className="w-3.5 h-3.5" /> Nenhum evento
            </Badge>
          )}
        </div>

        {hasR4020 ? (
          <>
            {/* R-4020 Summary */}
            <div className="px-4 py-3 bg-info-subtle border-b border-info-border grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-info-text">Nat. Rendimento:</span>{' '}
                <span className="font-mono font-semibold text-info-text">{r4020.natureza_rendimento || '-'}</span>
              </div>
              <div>
                <span className="text-info-text">Valor Bruto REINF:</span>{' '}
                <span className="font-semibold text-info-text">{formatCurrency(r4020.vl_rendimento_bruto)}</span>
              </div>
              <div>
                <span className="text-info-text">IR REINF:</span>{' '}
                <span className="font-semibold text-info-text">{formatCurrency(r4020.vl_ir)}</span>
              </div>
              <div>
                <span className="text-info-text">PCC REINF:</span>{' '}
                <span className="font-semibold text-info-text">{formatCurrency(r4020.vl_pcc)}</span>
              </div>
            </div>

            {/* Comparison Table */}
            <Table className="min-w-full divide-y divide-border text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-2 text-left font-semibold text-foreground h-auto">Campo</TableHead>
                  <TableHead className="px-4 py-2 text-right font-semibold text-foreground h-auto">NFS-e</TableHead>
                  <TableHead className="px-4 py-2 text-right font-semibold text-foreground h-auto">REINF</TableHead>
                  <TableHead className="px-4 py-2 text-right font-semibold text-foreground h-auto">Diferenca</TableHead>
                  <TableHead className="px-4 py-2 text-center font-semibold text-foreground h-auto">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                <ComparisonRow
                  label="Valor Bruto"
                  nfseValue={invoice?.valor_servicos || invoice?.vl_doc}
                  reinfValue={r4020.vl_rendimento_bruto}
                />
                <ComparisonRow
                  label="IRRF"
                  nfseValue={ret.irrf?.valor_nfse}
                  reinfValue={r4020.vl_ir}
                />
                <ComparisonRow
                  label="PIS"
                  nfseValue={ret.pcc?.pis_nfse}
                  reinfValue={r4020.vl_pis}
                />
                <ComparisonRow
                  label="COFINS"
                  nfseValue={ret.pcc?.cofins_nfse}
                  reinfValue={r4020.vl_cofins}
                />
                <ComparisonRow
                  label="CSLL"
                  nfseValue={ret.pcc?.csll_nfse}
                  reinfValue={r4020.vl_csll}
                />
              </TableBody>
            </Table>
          </>
        ) : (
          <div className="px-4 py-6 text-center text-muted-foreground text-sm">
            Nenhum evento R-4020 encontrado no REINF para este prestador/periodo.
            {(Number(ret.irrf?.valor_esperado || 0) > 0 || Number(ret.pcc?.valor_esperado || 0) > 0) && (
              <p className="mt-2 text-warning-text font-medium">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                Retencoes foram calculadas — verifique se o R-4020 ja foi transmitido.
              </p>
            )}
            {/* R-4020 Suggestion */}
            {analysis.reinf?.r4020_suggestion && (
              <div className="mt-4 bg-info-subtle border border-info-border rounded-lg p-4 text-left">
                <h4 className="text-sm font-semibold text-info-text mb-2">Sugestao: Transmitir R-4020</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-info-text">Evento:</span>{' '}
                    <span className="font-mono font-semibold text-info-text">{analysis.reinf.r4020_suggestion.evento}</span>
                  </div>
                  <div>
                    <span className="text-info-text">Periodo:</span>{' '}
                    <span className="font-mono font-semibold text-info-text">{analysis.reinf.r4020_suggestion.periodo_apuracao}</span>
                  </div>
                  <div>
                    <span className="text-info-text">Nat. Rendimento:</span>{' '}
                    <span className="font-mono font-semibold text-info-text">{analysis.reinf.r4020_suggestion.natureza_rendimento}</span>
                    <span className="text-info-text text-xs ml-1">({analysis.reinf.r4020_suggestion.natureza_descricao})</span>
                  </div>
                  <div>
                    <span className="text-info-text">CNPJ Beneficiario:</span>{' '}
                    <span className="font-mono font-semibold text-info-text">{analysis.reinf.r4020_suggestion.cnpj_beneficiario}</span>
                  </div>
                  <div>
                    <span className="text-info-text">Valor Bruto:</span>{' '}
                    <span className="font-semibold text-info-text">{formatCurrency(analysis.reinf.r4020_suggestion.vl_rendimento_bruto)}</span>
                  </div>
                  <div>
                    <span className="text-info-text">IR + PCC:</span>{' '}
                    <span className="font-semibold text-info-text">
                      {formatCurrency(analysis.reinf.r4020_suggestion.vl_ir)} + {formatCurrency(analysis.reinf.r4020_suggestion.vl_pcc)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* R-2010 Section — INSS */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-muted px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">R-2010 — Retencao INSS (Servicos Tomados)</h3>
          </div>
          {hasR2010 ? (
            <Badge variant="success">
              <CheckCircle className="w-3.5 h-3.5" /> {r2010.eventos} evento(s)
            </Badge>
          ) : (
            <Badge variant="secondary">
              {Number(ret.inss?.valor_esperado || 0) > 0 ? (
                <><XCircle className="w-3.5 h-3.5 text-destructive-text" /> Nenhum evento</>
              ) : (
                'INSS nao aplicavel'
              )}
            </Badge>
          )}
        </div>

        {hasR2010 ? (
          <Table className="min-w-full divide-y divide-border text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-2 text-left font-semibold text-foreground h-auto">Campo</TableHead>
                <TableHead className="px-4 py-2 text-right font-semibold text-foreground h-auto">NFS-e</TableHead>
                <TableHead className="px-4 py-2 text-right font-semibold text-foreground h-auto">REINF</TableHead>
                <TableHead className="px-4 py-2 text-right font-semibold text-foreground h-auto">Diferenca</TableHead>
                <TableHead className="px-4 py-2 text-center font-semibold text-foreground h-auto">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              <ComparisonRow
                label="INSS Retido"
                nfseValue={ret.inss?.valor_nfse}
                reinfValue={r2010.vl_ret_inss}
              />
            </TableBody>
          </Table>
        ) : (
          <div className="px-4 py-6 text-center text-muted-foreground text-sm">
            {Number(ret.inss?.valor_esperado || 0) > 0
              ? 'Retencao INSS calculada, mas nenhum evento R-2010 encontrado no REINF.'
              : 'INSS nao aplicavel para este servico.'
            }
          </div>
        )}
      </div>
    </div>
  )
}
