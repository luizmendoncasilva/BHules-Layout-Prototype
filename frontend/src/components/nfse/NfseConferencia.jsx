import { useState, useEffect, useCallback } from 'react'
import { ShieldAlert, RefreshCw, Loader2, Shuffle, Search } from 'lucide-react'
import {
  Badge, Button, Card,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@bhubai/bhub-design-system'
import { api } from '../../api/client'

function formatCurrency(val) {
  if (val == null) return '—'
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const TRIBUTO_LABELS = { irrf: 'IRRF', pcc: 'PIS/COFINS/CSLL', inss: 'INSS', iss: 'ISS' }

/** Conferência NFS-e: caça ao falso-negativo direcional + amostra de CONFORMEs.
 *
 * `onViewInvoice` segue o mesmo contrato usado pelo BatchAnalysis (App.jsx):
 * recebe o invoice_id e o chamador decide a navegação (setSelectedInvoice +
 * setCurrentView('detail')). Se não vier prop, o clique é um no-op — o
 * componente nunca quebra por falta de navegação externa (degradação graciosa).
 */
export default function NfseConferencia({ companyId, onViewInvoice }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [sampleSize, setSampleSize] = useState(10)

  const fetchConferencia = useCallback(async (size = sampleSize) => {
    setLoading(true)
    setError(false)
    try {
      const result = await api.getNfseConferencia(companyId, { sampleSize: size })
      setData(result)
    } catch {
      // Degradação silenciosa: a seção some/avisa, o resto do dashboard segue.
      setError(true)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [companyId, sampleSize])

  useEffect(() => {
    fetchConferencia()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId])

  const handleViewInvoice = (invoiceId) => {
    if (typeof onViewInvoice === 'function') onViewInvoice(invoiceId)
  }

  const handleNovoSorteio = () => fetchConferencia(sampleSize)

  return (
    <Card padding="none" className="gap-0 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Conferência</h2>
          <span className="text-xs text-muted-foreground">falso-negativo direcional + amostra CONFORME</span>
        </div>
        <Button
          onClick={handleNovoSorteio}
          disabled={loading}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Atualizar
        </Button>
      </div>

      {loading && !data && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-6 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando conferência...
        </div>
      )}

      {error && !loading && (
        <p className="text-xs text-muted-foreground text-center py-6">
          Conferência indisponível no momento.
        </p>
      )}

      {!loading && !error && data && (
        <>
          {/* fn_risk */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-xs font-semibold text-destructive-text">
                Retenção declarada sem match do motor ({data.fn_risk?.total ?? 0})
              </h3>
            </div>

            {(!data.fn_risk?.items || data.fn_risk.items.length === 0) ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhuma divergência direcional no período.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table className="text-xs bg-card">
                  <TableHeader>
                    <TableRow className="bg-muted hover:bg-muted">
                      <TableHead className="px-2 py-1.5 h-auto font-medium text-muted-foreground">Nota</TableHead>
                      <TableHead className="px-2 py-1.5 h-auto font-medium text-muted-foreground">Prestador</TableHead>
                      <TableHead className="px-2 py-1.5 h-auto font-medium text-muted-foreground">Serviço</TableHead>
                      <TableHead className="px-2 py-1.5 h-auto font-medium text-muted-foreground">Tributo</TableHead>
                      <TableHead className="px-2 py-1.5 h-auto font-medium text-muted-foreground text-right">Nota declara</TableHead>
                      <TableHead className="px-2 py-1.5 h-auto font-medium text-muted-foreground text-right">Motor esperava</TableHead>
                      <TableHead className="px-2 py-1.5 h-auto font-medium text-muted-foreground">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.fn_risk.items.map((item) => (
                      item.divergencias.map((div, di) => (
                        <TableRow
                          key={`${item.invoice_id}-${div.tributo}`}
                          className="hover:bg-destructive-subtle cursor-pointer"
                          onClick={() => handleViewInvoice(item.invoice_id)}
                          title="Abrir nota"
                        >
                          {di === 0 && (
                            <>
                              <TableCell className="px-2 py-1.5 text-xs font-mono text-primary" rowSpan={item.divergencias.length}>
                                {item.num_doc || item.invoice_id}
                              </TableCell>
                              <TableCell className="px-2 py-1.5 text-xs" rowSpan={item.divergencias.length}>
                                <div className="font-medium text-foreground">{item.emit_razao_social || '—'}</div>
                                <div className="text-[10px] text-muted-foreground">{item.emit_cnpj}</div>
                              </TableCell>
                              <TableCell className="px-2 py-1.5 text-xs" rowSpan={item.divergencias.length}>
                                {item.codigo_servico_lc116 || '—'}
                              </TableCell>
                            </>
                          )}
                          <TableCell className="px-2 py-1.5 text-xs font-semibold text-destructive-text">
                            {TRIBUTO_LABELS[div.tributo] || div.tributo}
                          </TableCell>
                          <TableCell className="px-2 py-1.5 text-xs text-right font-mono">{formatCurrency(div.nota_declara)}</TableCell>
                          <TableCell className="px-2 py-1.5 text-xs text-right font-mono">
                            {div.motor_esperava == null ? 'nunca analisada' : formatCurrency(div.motor_esperava)}
                          </TableCell>
                          {di === 0 && (
                            <TableCell className="px-2 py-1.5 text-xs" rowSpan={item.divergencias.length}>
                              <Badge variant="warning" className="text-[10px]">
                                {item.status_analise || 'PENDENTE'}
                              </Badge>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* amostra_conforme */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shuffle className="w-3.5 h-3.5 text-muted-foreground" />
                <h3 className="text-xs font-semibold text-foreground">
                  Amostra p/ conferência ({data.amostra_conforme?.total_conformes ?? 0} CONFORMEs)
                </h3>
              </div>
              <Button
                onClick={handleNovoSorteio}
                disabled={loading}
                variant="ghost"
                size="xs"
                className="gap-1 text-[10px] text-muted-foreground hover:text-primary"
              >
                <Shuffle className="w-3 h-3" /> Novo sorteio
              </Button>
            </div>

            {(!data.amostra_conforme?.items || data.amostra_conforme.items.length === 0) ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhuma nota CONFORME no período.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {data.amostra_conforme.items.map((item) => (
                  <button
                    key={item.invoice_id}
                    onClick={() => handleViewInvoice(item.invoice_id)}
                    className="flex items-center justify-between px-3 py-2 text-xs border border-border rounded-md hover:bg-muted text-left"
                  >
                    <div>
                      <div className="font-mono text-primary">{item.num_doc || item.invoice_id}</div>
                      <div className="text-muted-foreground">{item.emit_razao_social || '—'}</div>
                    </div>
                    <Search className="w-3.5 h-3.5 text-muted-foreground/60" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  )
}
