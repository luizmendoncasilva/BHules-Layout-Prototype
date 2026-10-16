import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Building2, Calendar, CheckCircle2, FileCheck, FileSearch, Filter, RefreshCw } from 'lucide-react'
import { decidirRevisaoExportacao, getRevisoesExportacao } from '../../services/tributacaoService'
import { DecisaoRevisaoModal } from './DecisaoRevisaoModal'
import { PrazoBadge, StatusBadge, feedbackDecisao } from './RevisoesExportacaoEmpresa'
import { GATILHO_REVISAO, STATUS_REVISAO, ehAberta, formatCompetencia, formatValorMoeda, tomadorDaNota } from './revisaoLabels'
import {
  Button,
  Card,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@bhubai/bhub-design-system'

// Radix Select não aceita SelectItem value="" — sentinela convertida para '' no estado.
const TODAS = '__all__'

/**
 * Visão geral das revisões de exportação (Tela AC2): todas as abertas, ordenadas por
 * prazo pelo servidor, com filtros de competência e empresa.
 */
export function RevisoesExportacaoVisaoGeral({ companies = [], initialCompanyId = '' }) {
  const [mes, setMes] = useState('')
  const [companyId, setCompanyId] = useState(initialCompanyId || '')
  const [status, setStatus] = useState('PENDENTE')
  const [revisoes, setRevisoes] = useState([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [selecionada, setSelecionada] = useState(null)

  const nomeEmpresa = useMemo(() => {
    const mapa = new Map(companies.map((c) => [String(c.id), c.razao_social || c.name || c.cnpj]))
    return (id) => mapa.get(String(id)) || `Empresa #${id}`
  }, [companies])

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const res = await getRevisoesExportacao({
        company_id: companyId || undefined,
        competencia: mes ? mes.replace('-', '') : undefined,
        status: status || undefined,
      })
      setRevisoes(Array.isArray(res) ? res : [])
    } catch (err) {
      setErro(err.message || 'Falha ao consultar revisões.')
      setRevisoes([])
    } finally {
      setLoading(false)
    }
  }, [companyId, mes, status])

  useEffect(() => {
    carregar()
  }, [carregar])

  const fechar = async (resultado) => {
    setSelecionada(null)
    if (resultado) {
      setFeedback({ type: 'success', text: feedbackDecisao(resultado) })
      await carregar()
    }
  }

  const abertas = revisoes.filter(ehAberta).length

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Card padding="none" className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <FileSearch className="w-5 h-5 text-info-text" />
            <span>Revisões de exportação</span>
          </div>
          <span className="text-muted-foreground/60">|</span>
          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <Select value={companyId ? String(companyId) : TODAS} onValueChange={(v) => setCompanyId(v === TODAS ? '' : v)}>
              <SelectTrigger size="sm" className="max-w-xs text-xs font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODAS}>Todas as empresas</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.razao_social || c.name || c.cnpj}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className="h-auto w-auto px-2 py-1 text-xs md:text-xs font-medium" title="Competência (vazio = todas)" />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={status || TODAS} onValueChange={(v) => setStatus(v === TODAS ? '' : v)}>
              <SelectTrigger size="sm" className="text-xs font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_REVISAO).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                <SelectItem value={TODAS}>Todas as situações</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={carregar} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-info-text' : 'text-muted-foreground'}`} />
          <span>Atualizar</span>
        </Button>
      </Card>

      {feedback && (
        <div className="p-3 rounded-md text-xs flex items-center gap-2 bg-success-subtle text-success-text border border-success-border">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback.text}</span>
        </div>
      )}
      {erro && (
        <div className="p-3 bg-destructive-subtle border border-destructive-border text-destructive-text rounded-md text-xs flex items-center justify-between">
          <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{erro}</span>
          <Button variant="ghost" size="xs" onClick={carregar} className="underline text-destructive-text hover:text-destructive-text">Tentar novamente</Button>
        </div>
      )}

      <Card padding="none" className="gap-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Fila por prazo</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Prazo = corte do DAS (5º dia útil) − 2 dias úteis; vencida sem decisão, a nota segue mercado interno</p>
          </div>
          <span className="text-xs font-medium text-muted-foreground">{revisoes.length} {revisoes.length === 1 ? 'revisão' : 'revisões'} · {abertas} abertas</span>
        </div>

        <div className="overflow-x-auto">
          <Table className="text-left text-xs bg-card">
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="px-4 py-3 h-auto font-semibold uppercase tracking-wider text-muted-foreground">Prazo</TableHead>
                <TableHead className="px-4 py-3 h-auto font-semibold uppercase tracking-wider text-muted-foreground">Empresa</TableHead>
                <TableHead className="px-3 py-3 h-auto font-semibold uppercase tracking-wider text-muted-foreground">Competência</TableHead>
                <TableHead className="px-3 py-3 h-auto font-semibold uppercase tracking-wider text-muted-foreground">Nota</TableHead>
                <TableHead className="px-4 py-3 h-auto font-semibold uppercase tracking-wider text-muted-foreground">Gatilho</TableHead>
                <TableHead className="px-4 py-3 h-auto font-semibold uppercase tracking-wider text-muted-foreground">Tomador / País</TableHead>
                <TableHead className="px-3 py-3 h-auto font-semibold uppercase tracking-wider text-muted-foreground">Subitem</TableHead>
                <TableHead className="px-3 py-3 h-auto font-semibold uppercase tracking-wider text-muted-foreground">Moeda</TableHead>
                <TableHead className="px-4 py-3 h-auto font-semibold uppercase tracking-wider text-muted-foreground">Situação</TableHead>
                <TableHead className="px-4 py-3 text-right h-auto font-semibold uppercase tracking-wider text-muted-foreground">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revisoes.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={10} className="px-6 py-10 text-center text-muted-foreground italic">
                    {loading ? 'Carregando fila de revisões...' : 'Nenhuma revisão para os filtros selecionados.'}
                  </TableCell>
                </TableRow>
              ) : (
                revisoes.map((rev) => {
                  const tomador = tomadorDaNota(rev.valores_nota)
                  return (
                    <TableRow key={rev.id} className="hover:bg-muted">
                      <TableCell className="px-4 py-3 whitespace-nowrap"><PrazoBadge rev={rev} /></TableCell>
                      <TableCell className="px-4 py-3 font-semibold text-foreground">{nomeEmpresa(rev.company_id)}</TableCell>
                      <TableCell className="px-3 py-3 whitespace-nowrap text-foreground">{formatCompetencia(rev.competencia)}</TableCell>
                      <TableCell className="px-3 py-3 font-mono font-semibold text-foreground whitespace-nowrap">#{rev.invoice_id}</TableCell>
                      <TableCell className="px-4 py-3 text-foreground">{GATILHO_REVISAO[rev.gatilho] || rev.gatilho}</TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="font-medium text-foreground">{tomador.nome}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">{tomador.pais}{tomador.doc ? ` · ${tomador.doc}` : ''}</div>
                      </TableCell>
                      <TableCell className="px-3 py-3 font-mono font-semibold text-foreground whitespace-nowrap">{rev.valores_nota?.codigo_servico_lc116 || '—'}</TableCell>
                      <TableCell className="px-3 py-3 whitespace-nowrap text-foreground">{formatValorMoeda(rev.valores_nota)}</TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge rev={rev} />
                        {rev.decidida_por && <div className="text-[10px] text-muted-foreground mt-0.5">por {rev.decidida_por}</div>}
                      </TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap text-right">
                        {ehAberta(rev) && (
                          <Button type="button" variant="info" size="sm" onClick={() => setSelecionada(rev)}>
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Decidir</span>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {selecionada && (
        <DecisaoRevisaoModal
          revisao={selecionada}
          empresaNome={nomeEmpresa(selecionada.company_id)}
          onDecidir={decidirRevisaoExportacao}
          onClose={fechar}
        />
      )}
    </div>
  )
}

export default RevisoesExportacaoVisaoGeral
