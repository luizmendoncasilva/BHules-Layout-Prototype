import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Card as DsCard, CardContent as DsCardContent, Badge, Tabs, TabsList, TabsTrigger,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Spinner, DatePicker, Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from '@bhubai/bhub-design-system'
import { api } from '../../api/client'
import { useCompanies } from '../../hooks/useCompanies'
import ChartCanvas, { BRAND_CHART_COLORS } from './ChartCanvas'
import MultiCompanySelect from '../shared/MultiCompanySelect'

// ── Constantes de apresentação ────────────────────────────────────────────
const SESSOES = [
  { key: 'dados', label: 'Dados das Notas' },
  { key: 'operacional', label: 'Visão Operacional' },
  { key: 'indicadores', label: 'Indicadores' },
  { key: 'legislacao', label: 'Legislação' },
]

const TIPO_LABEL = {
  NFE_ENTRADA: 'Entradas (NF-e)',
  NFE_SAIDA: 'Saídas (NF-e)',
  NFS_TOMADO: 'Serviços Tomados',
  NFS_PRESTADO: 'Serviços Prestados',
  NFCE: 'NFC-e',
  CTE_ENTRADA: 'CT-e Entradas',
  CTE_SAIDA: 'CT-e Saídas',
}
const TIPO_ORDER = ['NFE_ENTRADA', 'NFE_SAIDA', 'NFS_TOMADO', 'NFS_PRESTADO', 'NFCE', 'CTE_ENTRADA', 'CTE_SAIDA']

const SEV_VARIANT = {
  alta: 'destructive',
  media: 'warning',
  baixa: 'secondary',
}

const brl = (v) =>
  (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const num = (v) => (v || 0).toLocaleString('pt-BR')

function parseIsoDate(str) {
  if (!str) return null
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatIsoDate(date) {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function defaultRange() {
  const now = new Date()
  const end = now.toISOString().slice(0, 10)
  const start = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().slice(0, 10)
  return { start, end }
}

// ── Componentes de UI ──────────────────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <h2 className="text-xl font-semibold text-foreground">
      {children}
      <span className="text-primary">.</span>
    </h2>
  )
}

function Kpi({ label, value, foot, accent }) {
  return (
    <DsCard padding="sm" className={accent ? 'border-t-4 border-t-primary' : ''}>
      <DsCardContent>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-2xl font-semibold text-foreground mt-2 mb-1">{value}</div>
        {foot && <div className="text-xs text-muted-foreground">{foot}</div>}
      </DsCardContent>
    </DsCard>
  )
}

function Card({ children, className = '' }) {
  return (
    <DsCard className={className}>
      <DsCardContent>{children}</DsCardContent>
    </DsCard>
  )
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <Spinner size="xl" className="text-primary" />
    </div>
  )
}

// ── Sessão: Dados das Notas ─────────────────────────────────────────────────
function DadosNotas({ data }) {
  const dn = data?.dados_notas
  const chartData = useMemo(() => {
    if (!dn) return null
    const tipos = TIPO_ORDER.filter((t) => (dn.por_tipo[t]?.valor_total || 0) > 0)
    return {
      labels: tipos.map((t) => TIPO_LABEL[t]),
      datasets: [{
        data: tipos.map((t) => dn.por_tipo[t].valor_total),
        backgroundColor: tipos.map((_, i) => BRAND_CHART_COLORS[i % BRAND_CHART_COLORS.length]),
        borderWidth: 0,
      }],
    }
  }, [dn])

  const [sub, setSub] = useState('geral')
  if (!dn) return <Loading />
  const vg = dn.visao_geral

  return (
    <div className="space-y-5">
      {/* Sub-abas: visão geral + uma por tipo de documento */}
      <div>
        <Tabs value={sub} onValueChange={setSub}>
          <TabsList variant="default">
            {[{ key: 'geral', label: 'Visão Geral' }, ...TIPO_ORDER.map((t) => ({ key: t, label: TIPO_LABEL[t] }))].map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key}>{tab.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {sub === 'geral' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Kpi accent label="Total de Notas" value={num(vg.total_notas)} foot="Todos os tipos no período" />
            <Kpi label="Faturamento" value={brl(vg.total_faturamento)} foot="Saídas + serviços prestados + NFC-e" />
            <Kpi label="Entradas" value={brl(vg.total_entradas)} foot="Compras + serviços tomados" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <h3 className="font-semibold text-foreground mb-1">Distribuição de valor por tipo</h3>
              <p className="text-xs text-muted-foreground mb-3">Participação de cada documento no período</p>
              {chartData && chartData.labels.length > 0
                ? <ChartCanvas type="doughnut" data={chartData}
                    options={{ cutout: '60%', plugins: { legend: { position: 'bottom' } } }} />
                : <p className="text-sm text-muted-foreground py-12 text-center">Sem valores no período.</p>}
            </Card>
            <Card>
              <h3 className="font-semibold text-foreground mb-3">Resumo por tipo</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Notas</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Cancel.</TableHead>
                    <TableHead className="text-right">Devol.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TIPO_ORDER.map((t) => {
                    const r = dn.por_tipo[t] || {}
                    return (
                      <TableRow key={t} className="cursor-pointer" onClick={() => setSub(t)}>
                        <TableCell className="font-medium text-foreground whitespace-normal">{TIPO_LABEL[t]}</TableCell>
                        <TableCell className="text-right tabular-nums">{num(r.total_notas)}</TableCell>
                        <TableCell className="text-right tabular-nums">{brl(r.valor_total)}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">{num(r.canceladas?.qtd)}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">{num(r.devolucoes?.qtd)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
          </div>
        </>
      ) : (
        <TipoDetalhe tipo={sub} r={dn.por_tipo[sub] || {}} />
      )}
    </div>
  )
}

function TopList({ title, rows, render, emptyLabel }) {
  return (
    <Card>
      <h3 className="font-semibold text-foreground mb-3">{title}</h3>
      {(!rows || rows.length === 0) ? (
        <p className="text-sm text-muted-foreground py-6 text-center">{emptyLabel}</p>
      ) : (
        <Table>
          <TableBody>{rows.map(render)}</TableBody>
        </Table>
      )}
    </Card>
  )
}

function Expansivel({ titulo, qtd, valor }) {
  return (
    <Accordion type="single" collapsible className="bg-card border border-border rounded-lg shadow-sm px-5">
      <AccordionItem value="item" className="border-b-0">
        <AccordionTrigger className="hover:no-underline">
          <span className="font-semibold text-sm text-foreground flex items-center gap-2 flex-1">
            {titulo}
            <span className="ml-auto text-muted-foreground font-normal">
              {num(qtd)} nota(s) · {brl(valor)}
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="text-sm text-muted-foreground">
          {(qtd || 0) === 0
            ? 'Nenhuma no período.'
            : 'Detalhe documento-a-documento (lista) chega em uma próxima entrega — depende de endpoint de listagem. Aqui o agregado de quantidade e valor.'}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

function TipoDetalhe({ tipo, r }) {
  const ehEntrada = ['NFE_ENTRADA', 'NFS_TOMADO', 'CTE_ENTRADA'].includes(tipo)
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi accent label="Valor Total" value={brl(r.valor_total)} />
        <Kpi label="Total de Notas" value={num(r.total_notas)} />
        <Kpi label="Canceladas" value={num(r.canceladas?.qtd)} foot={brl(r.canceladas?.valor)} />
        <Kpi label="Devoluções" value={num(r.devolucoes?.qtd)} foot={brl(r.devolucoes?.valor)} />
      </div>

      {/* Canceladas / Devoluções — expansível. Hoje só o agregado (qtd+valor)
          vem do /metrics/bhub-tax; o detalhe documento-a-documento depende de um
          endpoint de listagem (próximo passo). */}
      <Expansivel titulo="Canceladas" qtd={r.canceladas?.qtd} valor={r.canceladas?.valor} />
      <Expansivel titulo="Devoluções" qtd={r.devolucoes?.qtd} valor={r.devolucoes?.valor} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TopList
          title={ehEntrada ? 'Top 10 fornecedores' : 'Top 10 clientes'}
          rows={r.top_parceiros}
          emptyLabel="Sem dados no período."
          render={(p, i) => (
            <TableRow key={i}>
              <TableCell className="text-foreground whitespace-normal">{p.nome || p.documento || '—'}</TableCell>
              <TableCell className="text-right tabular-nums">{brl(p.valor)}</TableCell>
            </TableRow>
          )}
        />
        <TopList
          title="Top 10 CFOP"
          rows={r.top_cfop}
          emptyLabel="Sem dados no período."
          render={(c, i) => (
            <TableRow key={i}>
              <TableCell className="font-mono text-foreground">{c.cfop}</TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">{num(c.qtd)} itens</TableCell>
            </TableRow>
          )}
        />
      </div>
    </div>
  )
}

// ── Sessão: Visão Operacional → Empresas com Alertas ────────────────────────
function Operacional({ anomalias }) {
  const chartData = useMemo(() => {
    if (!anomalias) return null
    const counts = {}
    for (const e of anomalias.por_empresa || []) {
      for (const a of e.anomalias) counts[a.label] = (counts[a.label] || 0) + a.qtd
    }
    const labels = Object.keys(counts)
    if (!labels.length) return null
    return {
      labels,
      datasets: [{ data: labels.map((l) => counts[l]), backgroundColor: BRAND_CHART_COLORS[0], borderRadius: 5 }],
    }
  }, [anomalias])

  if (!anomalias) return <Loading />
  const k = anomalias.kpis
  const pendentes = (anomalias.regras || []).filter((r) => !r.disponivel)

  return (
    <div className="space-y-5">
      <SectionTitle>Empresas com alertas</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Kpi accent label="Empresas com alerta" value={num(k.empresas_com_alerta)} />
        <Kpi label="Anomalias detectadas" value={num(k.anomalias_detectadas)} foot="no período" />
        <Kpi label="Severidade alta" value={num(k.severidade_alta)} foot="exigem ação imediata" />
      </div>

      {chartData && (
        <Card>
          <h3 className="font-semibold text-foreground mb-3">Anomalias por tipo</h3>
          <ChartCanvas type="bar" data={chartData}
            options={{ indexAxis: 'y', plugins: { legend: { display: false } } }} />
        </Card>
      )}

      <Card>
        <h3 className="font-semibold text-foreground mb-3">Empresas que requerem atenção</h3>
        {anomalias.por_empresa.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma anomalia detectada no período. 🎉</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Anomalias</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead>Severidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {anomalias.por_empresa.map((e) => (
                <TableRow key={e.company_id}>
                  <TableCell className="font-medium text-foreground whitespace-normal">{e.razao_social || `#${e.company_id}`}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-normal">{e.anomalias.map((a) => a.label).join(', ')}</TableCell>
                  <TableCell className="text-right tabular-nums">{num(e.total)}</TableCell>
                  <TableCell>
                    <Badge variant={SEV_VARIANT[e.severidade_max] || 'secondary'}>
                      {e.severidade_max}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {pendentes.length > 0 && (
        <Card className="bg-muted">
          <h3 className="font-semibold text-foreground mb-1">Regras pendentes de integração</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Declaradas na spec, ainda não avaliadas — dependem de dados que não temos hoje.
          </p>
          <div className="flex flex-wrap gap-2">
            {pendentes.map((r) => (
              <Badge key={r.key} variant="outline"
                className="bg-card gap-1.5"
                title={r.motivo_indisponivel}>
                <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                {r.label}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// ── Sessão: Legislação (qualidade da classificação do motor) ────────────────
function Indicadores({ bhules }) {
  if (!bhules) return <Loading />
  const faltantes = bhules.notas_faltantes || {}
  const iss = bhules.iss_municipio || {}
  const funil = bhules.funil_sla || {}
  const porSerie = faltantes.por_serie || []
  const statusOrder = ['PENDENTE', 'EM_ANALISE', 'CORRIGIR', 'APROVAR_OVERRIDE', 'BLOQUEAR_CONFIRMADO', 'DEVOLVER_FORNECEDOR', 'CANCELADO']
  const porStatus = funil.por_status || {}
  const statusKeys = [...new Set([...statusOrder, ...Object.keys(porStatus)])].filter((k) => porStatus[k])

  return (
    <div className="space-y-6">
      {/* Notas faltantes */}
      <div>
        <SectionTitle>Notas faltantes (quebra de sequência)</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Kpi accent label="Notas faltantes" value={num(faltantes.total_faltantes)} foot="números ausentes na sequência" />
          <Kpi label="Séries com quebra" value={num(faltantes.series_com_quebra)} foot="por empresa × série" />
        </div>
        <Card>
          {porSerie.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma quebra de sequência no período.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Série</TableHead>
                  <TableHead>Intervalo</TableHead>
                  <TableHead className="text-right">Faltantes</TableHead>
                  <TableHead>Números</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {porSerie.slice(0, 20).map((g, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-foreground">{g.company_id}</TableCell>
                    <TableCell className="font-mono">{g.serie || '—'}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{g.intervalo?.[0]}–{g.intervalo?.[1]}</TableCell>
                    <TableCell className="text-right font-semibold text-destructive-text">{num(g.qtd_faltantes)}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-normal">
                      {(g.faltantes || []).slice(0, 15).join(', ')}{g.qtd_faltantes > 15 ? '…' : ''}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      {/* ISS dentro/fora do município */}
      <div>
        <SectionTitle>ISS — dentro / fora do município (NFS-e)</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Kpi accent label="Fora do município" value={num(iss.fora_municipio)} foot="incidência ≠ prestador" />
          <Kpi label="Dentro do município" value={num(iss.dentro_municipio)} foot="incidência = prestador" />
          <Kpi label="Indefinido" value={num(iss.indefinido)} foot="sem município de incidência" />
          <Kpi label="Total NFS-e" value={num(iss.total)} />
        </div>
      </div>

      {/* Funil de conferência / SLA */}
      <div>
        <SectionTitle>Funil de conferência &amp; SLA</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Kpi accent label="SLA violado" value={num(funil.sla_violado)} foot="exceções fora do prazo" />
          <Kpi label="SLA ok" value={num(funil.sla_ok)} />
          <Kpi label="Total na fila" value={num(funil.total)} foot="itens em exceção" />
        </div>
        <Card>
          {statusKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Sem itens na fila de exceções no período.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statusKeys.map((s) => (
                  <TableRow key={s}>
                    <TableCell className="text-foreground">{s}</TableCell>
                    <TableCell className="text-right font-semibold">{num(porStatus[s])}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  )
}

function Legislacao({ bhules }) {
  if (!bhules) return <Loading />
  const cfop = bhules.cfop || {}
  const vhm = cfop.validacao_humano_motor || {}
  return (
    <div className="space-y-5">
      <SectionTitle>Regras &amp; CFOP</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Kpi accent label="Acertos motor × humano"
          value={num(vhm.acertos)} foot="notas revisadas em que o motor acertou" />
        <Kpi label="Erros motor × humano" value={num(vhm.erros)} foot="corrigidas na revisão" />
        <Kpi label="NCMs no topo" value={num((cfop.top_ncms || []).length)} foot="por volume de itens" />
      </div>
      <Card>
        <h3 className="font-semibold text-foreground mb-1">Grupos de Produtos / NCM</h3>
        <p className="text-xs text-muted-foreground mb-3">
          NCMs por volume — base que o motor usa para determinar CFOP/CST. A edição
          do Grupo de Produtos por NCM (espelho UniFiscal) depende de endpoint próprio.
        </p>
        {(cfop.top_ncms || []).length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Sem dados no período.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NCM</TableHead>
                <TableHead className="text-right">Itens</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(cfop.top_ncms || []).slice(0, 15).map((n, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-foreground">{n.ncm || n.codigo || '—'}</TableCell>
                  <TableCell className="text-right tabular-nums">{num(n.qtd || n.total || n.count)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      <p className="text-xs text-muted-foreground">
        Gaps (próximas entregas): edição NCM ↔ Grupo de Produtos (espelho UniFiscal),
        métricas de score de confiança e filtro por grupo de empresas (carteira/onda)
        — este último depende de um campo de agrupamento na Company, hoje inexistente.
      </p>
    </div>
  )
}

// ── Componente principal ────────────────────────────────────────────────────
export default function BHubTaxDashboard({ activeTab: activeTabProp, onTabChange }) {
  const initial = defaultRange()
  const { data: companies = [] } = useCompanies()
  const [sessaoLocal, setSessaoLocal] = useState('dados')
  const sessao = activeTabProp ?? sessaoLocal
  const setSessao = (s) => { setSessaoLocal(s); onTabChange?.(s) }
  const [startDate, setStartDate] = useState(initial.start)
  const [endDate, setEndDate] = useState(initial.end)
  const [companyIds, setCompanyIds] = useState([])  // [] = todas as empresas

  const [dados, setDados] = useState(null)
  const [anomalias, setAnomalias] = useState(null)
  const [bhules, setBhules] = useState(null)
  const [erro, setErro] = useState(null)

  // Cada sessão tem seu endpoint. As três queries são pesadas (~10s) e o gateway
  // corta em ~30s — disparar as três em paralelo a cada mudança de período
  // saturava o backend e gerava 504 (que o browser reportava como erro de CORS).
  // Buscamos só a sessão ATIVA (lazy); ao trocar de aba ou de filtro, busca sob
  // demanda. loadedKeys evita refetch quando os dados já estão frescos p/ o filtro.
  const filterKey = `${startDate}|${endDate}|${[...companyIds].sort((a, b) => a - b).join(',')}`
  const loadedKeys = useRef({ dados: null, operacional: null, legislacao: null })

  useEffect(() => {
    let cancelled = false
    const params = { startDate, endDate, companyIds: companyIds.length ? companyIds : undefined }
    const fontes = {
      dados: { get: () => api.getBhubTaxDados(params), set: setDados },
      operacional: { get: () => api.getAnomaliasEmpresas(params), set: setAnomalias },
      indicadores: { get: () => api.getBhulesMetrics(params), set: setBhules },
      legislacao: { get: () => api.getBhulesMetrics(params), set: setBhules },
    }
    const fonte = fontes[sessao]
    if (!fonte) return
    // já carregado para este filtro → não refaz
    if (loadedKeys.current[sessao] === filterKey) return
    setErro(null)
    fonte.set(null) // estado de carregando só desta sessão
    fonte.get()
      .then((v) => {
        if (cancelled) return
        fonte.set(v)
        loadedKeys.current[sessao] = filterKey
      })
      .catch((e) => { if (!cancelled) setErro(e?.message || 'Falha ao carregar dados') })
    return () => { cancelled = true }
  }, [filterKey, sessao])

  const sortedCompanies = useMemo(
    () => [...companies].sort((a, b) => (a.razao_social || '').localeCompare(b.razao_social || '')),
    [companies],
  )

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-background">
      {/* Header dark (Bushido Night) — always-dark chrome, uses sidebar tokens */}
      <div className="bg-sidebar text-sidebar-accent-foreground px-7 py-4 flex items-center gap-3">
        <span className="w-3 h-3 rounded-sm bg-coral-bold" />
        <div className="font-semibold text-lg tracking-wide">BHub<span className="text-coral-bold">Tax</span></div>
        <span className="text-sidebar-foreground text-sm font-normal">Dashboard de notas fiscais</span>
        <div className="ml-auto flex items-end gap-3">
          <div className="flex flex-col">
            <label className="text-xs uppercase tracking-wide text-sidebar-foreground font-semibold">Empresas</label>
            <MultiCompanySelect
              companies={sortedCompanies}
              selectedIds={companyIds}
              onChange={setCompanyIds}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs uppercase tracking-wide text-sidebar-foreground font-semibold">Início</label>
            <DatePicker
              value={parseIsoDate(startDate)}
              onValueChange={(date) => setStartDate(formatIsoDate(date))}
              className="bg-sidebar-accent border-sidebar-border text-sidebar-accent-foreground h-auto py-1 text-sm w-auto"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs uppercase tracking-wide text-sidebar-foreground font-semibold">Fim</label>
            <DatePicker
              value={parseIsoDate(endDate)}
              onValueChange={(date) => setEndDate(formatIsoDate(date))}
              className="bg-sidebar-accent border-sidebar-border text-sidebar-accent-foreground h-auto py-1 text-sm w-auto"
            />
          </div>
        </div>
      </div>

      {/* Título da sessão — a navegação entre sessões agora vive na sidebar */}
      <div className="bg-card border-b border-border px-7 py-3">
        <h1 className="text-base font-semibold text-foreground">
          BHub Tax — {SESSOES.find((s) => s.key === sessao)?.label}
        </h1>
      </div>

      <div className="p-7 max-w-7xl w-full mx-auto">
        {erro && (
          <div className="mb-4 bg-destructive-subtle border border-destructive-border text-destructive-text rounded-lg px-4 py-3 text-sm">
            Erro ao carregar: {erro}
          </div>
        )}
        {sessao === 'dados' && <DadosNotas data={dados} />}
        {sessao === 'operacional' && <Operacional anomalias={anomalias} />}
        {sessao === 'indicadores' && <Indicadores bhules={bhules} />}
        {sessao === 'legislacao' && <Legislacao bhules={bhules} />}
      </div>
    </div>
  )
}
