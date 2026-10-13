import React, { useCallback, useEffect, useRef, useState } from 'react'
import { X, ListChecks, Copy, Check, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  IconButton,
  Spinner,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@bhubai/bhub-design-system'
import { api } from '../../api/client'
import { getTrackingOrigensNotas } from '../../services/tributacaoService'

/**
 * Drill-down de um card do tracking de origens (spec TRK-12..15).
 *
 * Três abas: notas só na origem (represadas), só no BHules e em ambos.
 * Linha com `invoice_id` abre o detalhe da nota pelo mesmo fluxo da listagem
 * (`onOpenInvoice`, que é o `onRowClick` da ListView). Linha sem id mostra a
 * chave copiável.
 */

const ABAS = [
  { id: 'so_origem', label: 'Só na origem', vazio: 'Nenhuma nota só na origem nesta competência.' },
  { id: 'so_bhules', label: 'Só no BHules', vazio: 'Nenhuma nota só no BHules nesta competência.' },
  { id: 'em_ambos', label: 'Em ambos', vazio: 'Nenhuma nota presente nos dois lados nesta competência.' },
]

function formatCompetencia(comp) {
  const c = String(comp || '').replace(/[-/]/g, '')
  return c.length >= 6 ? `${c.slice(4, 6)}/${c.slice(0, 4)}` : comp
}

function formatData(iso) {
  if (!iso) return '—'
  const [y, m, d] = String(iso).slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

function formatValor(v) {
  if (v === null || v === undefined || v === '') return '—'
  const n = Number(v)
  if (Number.isNaN(n)) return String(v)
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function DivergenciaBadge({ nota, competencia }) {
  if (nota.divergencia === 'BALDE') {
    return (
      <Badge
        variant="info"
        className="px-1.5 text-[10px] font-semibold"
        title={`A origem informa ${nota.provider || '—'}; o BHules gravou a nota como ${nota.api_source || 'sem origem'}.`}
      >
        veio por outra origem: {nota.api_source || 'sem origem'}
      </Badge>
    )
  }
  if (nota.divergencia === 'COMPETENCIA') {
    return (
      <span
        className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-magic-subtle text-magic-bold whitespace-nowrap"
        title={`A origem lista a nota em ${formatCompetencia(competencia)}; no BHules o dt_doc é ${formatData(nota.dt_doc)}.`}
      >
        dt_doc em {nota.dt_doc ? formatCompetencia(nota.dt_doc.slice(0, 7)) : '—'}
      </span>
    )
  }
  return null
}

function ChaveCopiavel({ chave }) {
  const [copiado, setCopiado] = useState(false)
  if (!chave) return <span className="text-muted-foreground">—</span>
  const copiar = async (e) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(chave)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    } catch {
      /* clipboard indisponível (http/permissão) — a chave continua selecionável */
    }
  }
  return (
    <span className="inline-flex items-center gap-1 max-w-[260px]">
      <span className="font-mono text-[11px] text-foreground truncate select-all" title={chave}>{chave}</span>
      <IconButton
        type="button"
        variant="ghost"
        size="xs"
        onClick={copiar}
        className="size-5 text-muted-foreground hover:text-foreground shrink-0"
        title="Copiar chave"
        aria-label="Copiar chave"
      >
        {copiado ? <Check className="w-3 h-3 text-success-text" /> : <Copy className="w-3 h-3" />}
      </IconButton>
    </span>
  )
}

export default function TrackingNotasPanel({
  open,
  onClose,
  companyId,
  competencia,
  canal,
  abaInicial = 'so_origem',
  onOpenInvoice,
}) {
  const [aba, setAba] = useState(abaInicial)
  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState(null)
  const [abrindoId, setAbrindoId] = useState(null)
  const [erroAbrir, setErroAbrir] = useState(null)
  // Só a requisição mais recente pode escrever no estado: fechar o Jettax e abrir
  // o Unecont não pode deixar a resposta atrasada do Jettax sob o título Unecont.
  const requisicaoAtual = useRef(0)

  // forcar=true (Recarregar / Tentar novamente) ignora o cache da IntegradorNF.
  const carregar = useCallback(async (forcar = false) => {
    const minha = ++requisicaoAtual.current
    if (!companyId || !canal?.canal) return
    setLoading(true)
    setErro(null)
    try {
      const res = await getTrackingOrigensNotas(companyId, canal.canal, competencia, { refresh: forcar })
      if (minha !== requisicaoAtual.current) return
      setDados(res)
    } catch (err) {
      if (minha !== requisicaoAtual.current) return
      setErro(err?.message || 'Erro ao carregar as notas.')
      setDados(null)
    } finally {
      if (minha === requisicaoAtual.current) setLoading(false)
    }
  }, [companyId, canal?.canal, competencia])

  // Fechar o painel invalida a requisição em voo.
  useEffect(() => {
    if (!open) requisicaoAtual.current += 1
  }, [open])

  useEffect(() => {
    if (!open) return
    setAba(abaInicial)
    setDados(null)
    setErroAbrir(null)
    carregar()
  }, [open, abaInicial, carregar])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const abrirNota = async (nota) => {
    if (!nota.invoice_id || !onOpenInvoice) return
    setAbrindoId(nota.invoice_id)
    setErroAbrir(null)
    try {
      // DetailView lê vários campos do objeto, não só o id: busca a nota completa.
      const invoice = await api.getInvoice(nota.invoice_id)
      onClose?.()
      onOpenInvoice(invoice)
    } catch {
      setErroAbrir('Não foi possível abrir a nota. Tente novamente.')
    } finally {
      setAbrindoId(null)
    }
  }

  if (!open) return null

  const lista = dados?.[aba]
  const origemIndisponivel = dados && !dados.upstream_disponivel
  const abaDependeDaOrigem = aba === 'so_origem' || aba === 'em_ambos'

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center backdrop-blur-sm p-4"
      onClick={() => onClose?.()}
    >
      <Card
        padding="none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tracking-notas-title"
        className="gap-0 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[88vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <ListChecks className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 id="tracking-notas-title" className="text-base font-semibold text-foreground">
                {canal?.nome || 'Origem'} · competência {formatCompetencia(competencia)}
              </h3>
              <p className="text-xs text-muted-foreground">
                Conciliação por chave entre a origem e o BHules.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <IconButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => carregar(true)}
              disabled={loading}
              className="text-muted-foreground"
              title="Recarregar"
              aria-label="Recarregar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
            </IconButton>
            <IconButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Fechar"
              className="text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </IconButton>
          </div>
        </div>

        {/* Abas */}
        <div className="px-6 border-b border-border flex items-center gap-1">
          {ABAS.map((a) => {
            const total = dados?.[a.id]?.total
            const ativa = a.id === aba
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setAba(a.id)}
                className={`px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  ativa ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {a.label}
                {typeof total === 'number' && (
                  <span className={`ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded ${ativa ? 'bg-primary/10' : 'bg-muted'}`}>
                    {total}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Corpo */}
        <div className="flex-1 overflow-auto">
          {erroAbrir && (
            <div className="mx-6 mt-4 px-3 py-2 rounded-md bg-destructive-subtle border border-destructive-border text-destructive-text text-xs">
              {erroAbrir}
            </div>
          )}

          {origemIndisponivel && abaDependeDaOrigem && !loading && (
            <div className="mx-6 mt-4 px-3 py-2 rounded-md bg-muted border border-border text-foreground text-xs flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
              {canal?.canal === 'gdocs'
                ? 'Esta origem ainda não está integrada ao tracking. Só as notas do BHules estão disponíveis.'
                : 'A IntegradorNF não respondeu. Só as notas do BHules estão disponíveis.'}
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Spinner size="xl" className="text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Carregando notas…</p>
            </div>
          )}

          {!loading && erro && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="text-sm text-destructive-text max-w-lg text-center">{erro}</p>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => carregar(true)}
                className="font-semibold text-destructive-text hover:text-destructive-text underline"
              >
                Tentar novamente
              </Button>
            </div>
          )}

          {!loading && !erro && lista && lista.itens.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-16">
              {ABAS.find((a) => a.id === aba)?.vazio}
            </p>
          )}

          {!loading && !erro && lista && lista.itens.length > 0 && (
            <>
              {lista.truncado && (
                <p className="px-6 pt-3 text-xs text-warning-text">
                  Mostrando {lista.itens.length} de {lista.total}.
                </p>
              )}
              <table className="w-full text-xs">
                <TableHeader className="sticky top-0 bg-muted text-[10px] uppercase tracking-wide text-muted-foreground">
                  <TableRow className="bg-muted hover:bg-muted">
                    <TableHead className="text-left font-semibold h-auto text-[10px] px-6 py-2">Chave</TableHead>
                    <TableHead className="text-left font-semibold h-auto text-[10px] px-2 py-2">Nº</TableHead>
                    <TableHead className="text-left font-semibold h-auto text-[10px] px-2 py-2">Tipo</TableHead>
                    <TableHead className="text-left font-semibold h-auto text-[10px] px-2 py-2">Direção</TableHead>
                    <TableHead className="text-left font-semibold h-auto text-[10px] px-2 py-2">Origem</TableHead>
                    <TableHead className="text-left font-semibold h-auto text-[10px] px-2 py-2">Emitente</TableHead>
                    <TableHead className="text-right font-semibold h-auto text-[10px] px-2 py-2">Valor</TableHead>
                    <TableHead className="text-left font-semibold h-auto text-[10px] px-2 py-2">Data</TableHead>
                    <TableHead className="text-left font-semibold h-auto text-[10px] px-2 py-2">Status</TableHead>
                    <TableHead className="text-left font-semibold h-auto text-[10px] px-2 py-2 pr-6">Observação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lista.itens.map((n, idx) => {
                    const clicavel = Boolean(n.invoice_id && onOpenInvoice)
                    return (
                      <TableRow
                        key={`${n.chave || 'sem-chave'}-${n.invoice_id || idx}`}
                        onClick={clicavel ? () => abrirNota(n) : undefined}
                        className={clicavel ? 'cursor-pointer hover:bg-primary/5' : 'hover:bg-transparent'}
                        title={clicavel ? 'Abrir a nota no BHules' : undefined}
                      >
                        <TableCell className="px-6 py-2 text-xs"><ChaveCopiavel chave={n.chave} /></TableCell>
                        <TableCell className="px-2 py-2 text-foreground text-xs">{n.numero || '—'}</TableCell>
                        <TableCell className="px-2 py-2 text-foreground text-xs">{n.tipo || '—'}</TableCell>
                        <TableCell className="px-2 py-2 text-foreground text-xs">
                          {n.direcao === 'SAIDA' ? 'Saída' : n.direcao === 'ENTRADA' ? 'Entrada' : '—'}
                        </TableCell>
                        <TableCell className="px-2 py-2 text-foreground text-xs">{n.provider || n.api_source || '—'}</TableCell>
                        <TableCell className="px-2 py-2 text-foreground max-w-[220px] truncate text-xs" title={n.emitente || ''}>
                          {n.emitente || '—'}
                        </TableCell>
                        <TableCell className="px-2 py-2 text-right text-foreground tabular-nums text-xs">{formatValor(n.valor)}</TableCell>
                        <TableCell className="px-2 py-2 text-foreground text-xs">{formatData(n.dt_doc)}</TableCell>
                        <TableCell className="px-2 py-2 text-foreground text-xs">{n.status_analise || '—'}</TableCell>
                        <TableCell className="px-2 py-2 pr-6 text-xs">
                          <span className="inline-flex items-center gap-1.5">
                            <DivergenciaBadge nota={n} competencia={competencia} />
                            {!n.invoice_id && aba === 'so_origem' && (
                              <span className="text-[10px] text-warning-text font-medium">não chegou ao BHules</span>
                            )}
                            {clicavel && (
                              abrindoId === n.invoice_id
                                ? <RefreshCw className="w-3 h-3 animate-spin text-primary" />
                                : <ExternalLink className="w-3 h-3 text-muted-foreground" />
                            )}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </table>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
