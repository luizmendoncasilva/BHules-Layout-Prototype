import React, { useState, useMemo, useEffect, useRef } from 'react'
import { RefreshCw, Power, PowerOff, Database, Activity, Clock, FileText, Search } from 'lucide-react'
import {
  Badge,
  Button,
  Input,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@bhubai/bhub-design-system'
import {
  useCrawlSources,
  useCrawlJobs,
  useSyncSource,
  useSyncAllSources,
  useToggleSource,
  useLegislationArticles,
} from '../../hooks/useLegislation'
import Pagination from '../shared/Pagination'

function formatRelativeTime(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now - d
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `${diffMin}min atrás`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h atrás`
  const diffD = Math.floor(diffH / 24)
  return `${diffD}d atrás`
}

function formatNextRun(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = d - now
  if (diffMs <= 0) return 'pendente'

  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const dayDiff = Math.floor(diffMs / 86400000)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')

  if (dayDiff === 0) return `Hoje ${hh}:${mm}`
  if (dayDiff === 1) return `Amanhã ${hh}:${mm}`
  if (dayDiff < 7) return `${days[d.getDay()]} ${hh}:${mm}`

  const dd = String(d.getDate()).padStart(2, '0')
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mo} ${hh}:${mm}`
}

function formatDuration(start, end) {
  if (!start || !end) return '-'
  const ms = new Date(end) - new Date(start)
  if (ms < 1000) return `${ms}ms`
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

function StatusDot({ active }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${active ? 'bg-success' : 'bg-neutral-300'}`} />
  )
}

// Maps fiscal analysis impact tags to a neutral categorical badge style
// (these are topic/category labels, not status indicators, so we keep them
// visually uniform using the neutral/outline variant rather than borrowing
// semantic success/warning/destructive/info colors that imply state).
function ImpactBadges({ impact }) {
  if (!impact) return <span className="text-muted-foreground text-xs">-</span>
  const tags = impact.split(',').map(t => t.trim()).filter(Boolean)
  return (
    <div className="flex flex-wrap gap-1 max-w-xs">
      {tags.map((tag) => (
        <Badge key={tag} variant="outline" className="text-xs whitespace-nowrap">
          {tag}
        </Badge>
      ))}
    </div>
  )
}

// Category badges are neutral/categorical (not status), so all share the
// same outline treatment for visual consistency with the token system.
const CATEGORY_LABELS = {
  CFOP: 'CFOP',
  NCM: 'NCM',
  CST_ICMS: 'CST ICMS',
  CST_PIS: 'CST PIS',
  CST_COFINS: 'CST COFINS',
  ISS: 'ISS',
  IRRF: 'IRRF',
  PIS_COFINS_CSLL: 'PIS/COFINS/CSLL',
  INSS: 'INSS',
  CPOM: 'CPOM',
  REINF: 'REINF',
  DCTFWEB: 'DCTFWeb',
}

const TAB_CONFIG = {
  NFE: {
    label: 'Leis Federais e Estaduais',
    subtitle: 'Fontes de legislação para NF-e (mercadorias): ICMS, IPI, PIS/COFINS, NCM, CFOP',
  },
  NFSE: {
    label: 'Leis Federais e Municipais',
    subtitle: 'Fontes de legislação para NFS-e (serviços): ISS, IRRF, INSS, PIS/COFINS/CSLL, REINF',
  },
}

function CategoryBadges({ categories }) {
  if (!categories || categories.length === 0) return <span className="text-muted-foreground text-xs">-</span>
  return (
    <div className="flex flex-wrap gap-1">
      {categories.map((cat) => (
        <Badge key={cat} variant="outline" className="text-xs font-semibold whitespace-nowrap">
          {CATEGORY_LABELS[cat] || cat}
        </Badge>
      ))}
    </div>
  )
}

function ArticlesCell({ total, embedded }) {
  if (!total) return <span className="text-muted-foreground">0</span>
  return (
    <div className="text-right">
      <span className="font-semibold text-foreground">{total.toLocaleString('pt-BR')}</span>
      <div className="text-xs text-muted-foreground mt-0.5">
        {embedded.toLocaleString('pt-BR')} vetorizados
      </div>
    </div>
  )
}

// Coverage % is a status-like indicator (>=90% healthy, >=50% at-risk,
// >0% critical, 0 neutral) so it maps to success/warning/destructive.
function CoverageBar({ pct }) {
  const color = pct >= 90 ? 'bg-success' : pct >= 50 ? 'bg-warning' : pct > 0 ? 'bg-destructive' : 'bg-neutral-300'
  const textColor = pct >= 90 ? 'text-success-text' : pct >= 50 ? 'text-warning-text' : pct > 0 ? 'text-destructive-text' : 'text-muted-foreground'
  return (
    <div className="flex items-center gap-2 min-w-25">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={`text-xs font-semibold tabular-nums ${textColor}`}>{pct}%</span>
    </div>
  )
}

export default function CrawlerDashboard({ activeTab: activeTabProp, onTabChange }) {
  const [tabLocal, setTabLocal] = useState('NFE')
  const tab = activeTabProp ?? tabLocal
  const setTab = (t) => { setTabLocal(t); onTabChange?.(t) }
  const [articlesPage, setArticlesPage] = useState(1)
  const [articlesPageSize, setArticlesPageSize] = useState(50)
  const [articlesSearch, setArticlesSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [expandedArticleId, setExpandedArticleId] = useState(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(articlesSearch)
      setArticlesPage(1)
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [articlesSearch])

  const { data: sources, isLoading: sourcesLoading } = useCrawlSources(tab)
  const { data: articlesData, isLoading: articlesLoading } = useLegislationArticles({ page: articlesPage, pageSize: articlesPageSize, search: debouncedSearch || undefined })
  const { data: embeddedStats } = useLegislationArticles({ page: 1, pageSize: 1, hasEmbedding: true })
  const syncMutation = useSyncSource()
  const syncAllMutation = useSyncAllSources()
  const toggleMutation = useToggleSource()
  const [syncingSource, setSyncingSource] = useState(null)
  const [syncingAll, setSyncingAll] = useState(false)
  const [sourcesSearch, setSourcesSearch] = useState('')
  const [jobsSearch, setJobsSearch] = useState('')

  const sourceList = useMemo(() => {
    const list = Array.isArray(sources) ? sources : (sources?.items || [])
    if (!sourcesSearch.trim()) return list
    const term = sourcesSearch.trim().toLowerCase()
    return list.filter((s) =>
      (s.name || '').toLowerCase().includes(term) ||
      (s.source_type || '').toLowerCase().includes(term) ||
      (s.business_impact || '').toLowerCase().includes(term) ||
      (s.data_categories || []).some((c) => c.toLowerCase().includes(term))
    )
  }, [sources, sourcesSearch])

  // Poll jobs when a sync is active
  const isPolling = syncingSource !== null || syncingAll
  const { data: jobs, isLoading: jobsLoading } = useCrawlJobs(20, { pollingEnabled: isPolling })

  const jobList = useMemo(() => {
    const list = Array.isArray(jobs) ? jobs : (jobs?.items || [])
    if (!jobsSearch.trim()) return list
    const term = jobsSearch.trim().toLowerCase()
    return list.filter((j) =>
      (j.source_name || '').toLowerCase().includes(term) ||
      (j.status || '').toLowerCase().includes(term) ||
      (j.error_message || '').toLowerCase().includes(term)
    )
  }, [jobs, jobsSearch])

  // Totals from actual article counts (authoritative)
  const totalArticles = articlesData?.total || 0
  const totalEmbedded = embeddedStats?.total || 0
  const activeSources = sourceList.filter(s => s.enabled).length
  const embeddedPct = totalArticles > 0 ? Math.round((totalEmbedded / totalArticles) * 100) : 0

  return (
    <div className="flex flex-col h-full bg-background overflow-auto">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-muted flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Legislação — {TAB_CONFIG[tab].label}</h1>
          <p className="text-sm text-muted-foreground mt-1">{TAB_CONFIG[tab].subtitle}</p>
        </div>
        <Button
          onClick={() => {
            setSyncingAll(true)
            syncAllMutation.mutate(undefined, {
              onSettled: () => setSyncingAll(false),
            })
          }}
          disabled={syncingAll}
        >
          <RefreshCw className={`w-4 h-4 ${syncingAll ? 'animate-spin' : ''}`} />
          {syncingAll ? 'Sincronizando...' : 'Sincronizar Todas'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="px-6 py-5 grid grid-cols-4 gap-4">
        <SummaryCard icon={FileText} label="Total Artigos" value={totalArticles.toLocaleString('pt-BR')} />
        <SummaryCard
          icon={Database}
          label="Vetorizados para IA"
          value={`${totalEmbedded.toLocaleString('pt-BR')} de ${totalArticles.toLocaleString('pt-BR')} (${embeddedPct}%)`}
          small
        />
        <SummaryCard icon={Activity} label="Fontes Ativas" value={`${activeSources} / ${sourceList.length}`} />
        <SummaryCard
          icon={Clock}
          label="Última Sincronização"
          value={jobList.length > 0 ? formatRelativeTime(jobList[0]?.started_at) : '-'}
        />
      </div>

      {/* Sources Table */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">Fontes de Legislação</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                type="text"
                value={sourcesSearch}
                onChange={(e) => setSourcesSearch(e.target.value)}
                placeholder="Buscar fontes..."
                className="pl-8 h-8 w-56"
              />
            </div>
            <p className="text-xs text-muted-foreground">{TAB_CONFIG[tab].subtitle}</p>
          </div>
        </div>
        {sourcesLoading ? (
          <div className="flex items-center justify-center h-24 text-muted-foreground">
            <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mr-2" />
            Carregando fontes...
          </div>
        ) : (
          <Table className="max-h-96 overflow-y-auto">
            <TableHeader className="sticky top-0 z-10 bg-muted">
              <TableRow>
                <TableHead>Fonte</TableHead>
                <TableHead>Categorias</TableHead>
                <TableHead>Impacto na Análise Fiscal</TableHead>
                <TableHead className="text-right">Artigos</TableHead>
                <TableHead>Cobertura</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Última Execução</TableHead>
                <TableHead>Próxima Execução</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sourceList.map((source) => (
                <TableRow key={source.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">{source.name}</div>
                    <div className="text-xs text-muted-foreground">{source.source_type}</div>
                  </TableCell>
                  <TableCell>
                    <CategoryBadges categories={source.data_categories} />
                  </TableCell>
                  <TableCell>
                    <ImpactBadges impact={source.business_impact} />
                  </TableCell>
                  <TableCell>
                    <ArticlesCell
                      total={source.articles_count ?? 0}
                      embedded={source.embedded_count ?? 0}
                    />
                  </TableCell>
                  <TableCell>
                    <CoverageBar pct={source.articles_count > 0 ? Math.round((source.embedded_count / source.articles_count) * 100) : 0} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1.5">
                      <StatusDot active={source.enabled} />
                      <span className={`text-xs ${source.enabled ? 'text-success-text' : 'text-muted-foreground'}`}>
                        {source.enabled ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatRelativeTime(source.last_crawled_at)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {source.enabled ? formatNextRun(source.next_run_at) : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => {
                          setSyncingSource(source.source_type)
                          syncMutation.mutate(source.source_type, {
                            onSettled: () => setSyncingSource(null),
                          })
                        }}
                        disabled={syncingSource === source.source_type || syncingAll}
                      >
                        <RefreshCw className={`w-3 h-3 ${syncingSource === source.source_type ? 'animate-spin' : ''}`} />
                        {syncingSource === source.source_type ? 'Syncing...' : 'Sync'}
                      </Button>
                      <Button
                        variant={source.enabled ? 'destructive' : 'success'}
                        size="xs"
                        onClick={() => toggleMutation.mutate({ id: source.id, enabled: !source.enabled })}
                        disabled={toggleMutation.isPending}
                      >
                        {source.enabled ? (
                          <><PowerOff className="w-3 h-3" /> Desativar</>
                        ) : (
                          <><Power className="w-3 h-3" /> Ativar</>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {sourceList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    Nenhuma fonte configurada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Legislation Articles */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">Artigos de Legislação Mapeados</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                type="text"
                value={articlesSearch}
                onChange={(e) => setArticlesSearch(e.target.value)}
                placeholder="Buscar artigos..."
                className="pl-8 h-8 w-64"
              />
            </div>
            {articlesData && (
              <span className="text-xs text-muted-foreground">{articlesData.total} artigo{articlesData.total !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
        {articlesLoading ? (
          <div className="flex items-center justify-center h-24 text-muted-foreground">
            <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mr-2" />
            Carregando artigos...
          </div>
        ) : (
          <div>
            {/* Long article list — kept slightly larger than the 24rem scale step (max-h-96) to reduce scroll churn */}
            <Table className="max-h-[28rem] overflow-y-auto">
              <TableHeader className="sticky top-0 z-10 bg-muted">
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Órgão</TableHead>
                  <TableHead>Artigo</TableHead>
                  <TableHead>Conteúdo</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-center">Embedding</TableHead>
                  <TableHead>Atualizado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(articlesData?.items || []).map((article) => (
                  <React.Fragment key={article.id}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() => setExpandedArticleId(expandedArticleId === article.id ? null : article.id)}
                    >
                      <TableCell>
                        <Badge variant="info" className="text-xs">
                          {(article.source_tipo || '').replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{article.source_numero}</TableCell>
                      <TableCell className="text-muted-foreground">{article.source_orgao}</TableCell>
                      <TableCell className="font-medium text-foreground">{article.artigo}</TableCell>
                      <TableCell className="text-muted-foreground max-w-sm truncate">{article.content}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(article.tags || '').split(',').filter(Boolean).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs font-medium whitespace-nowrap">
                              {tag.trim()}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-block w-2 h-2 rounded-full ${article.has_embedding ? 'bg-success' : 'bg-neutral-300'}`} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {article.updated_at ? formatRelativeTime(article.updated_at) : '-'}
                      </TableCell>
                    </TableRow>
                    {expandedArticleId === article.id && (
                      <TableRow>
                        <TableCell colSpan={8} className="whitespace-normal bg-muted border-t border-b border-border">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="font-semibold text-foreground">{article.source_tipo} {article.source_numero}</span>
                              <span className="text-border">|</span>
                              <span>{article.source_orgao}</span>
                              <span className="text-border">|</span>
                              <span>{article.artigo}</span>
                            </div>
                            <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap bg-card rounded-lg p-4 border border-border max-h-96 overflow-y-auto">
                              {article.content || 'Conteudo nao disponivel'}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {article.has_embedding && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success inline-block" /> Vetorizado para busca IA</span>}
                              {article.updated_at && <span>Atualizado: {new Date(article.updated_at).toLocaleDateString('pt-BR')}</span>}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
                {(!articlesData?.items || articlesData.items.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      Nenhum artigo mapeado ainda
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {articlesData && articlesData.total > 0 && (
              <Pagination
                page={articlesPage}
                totalPages={Math.max(1, Math.ceil(articlesData.total / articlesPageSize))}
                totalItems={articlesData.total}
                pageSize={articlesPageSize}
                onPageChange={setArticlesPage}
                onPageSizeChange={(size) => { setArticlesPageSize(size); setArticlesPage(1) }}
              />
            )}
          </div>
        )}
      </div>

      {/* Jobs History Table */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">Histórico de Jobs</h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              type="text"
              value={jobsSearch}
              onChange={(e) => setJobsSearch(e.target.value)}
              placeholder="Buscar jobs..."
              className="pl-8 h-8 w-56"
            />
          </div>
        </div>
        {jobsLoading ? (
          <div className="flex items-center justify-center h-24 text-muted-foreground">
            <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mr-2" />
            Carregando jobs...
          </div>
        ) : (
          <Table className="max-h-96 overflow-y-auto">
            <TableHeader className="sticky top-0 z-10 bg-muted">
              <TableRow>
                <TableHead>Fonte</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead className="text-right">Encontrados</TableHead>
                <TableHead className="text-right">Novos</TableHead>
                <TableHead className="text-right">Atualizados</TableHead>
                <TableHead className="text-right">Embeddings</TableHead>
                <TableHead>Erro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobList.map((job, idx) => (
                <TableRow key={job.id || idx}>
                  <TableCell className="font-medium text-foreground">{job.source_name || '-'}</TableCell>
                  <TableCell>
                    <JobStatusBadge status={job.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatRelativeTime(job.started_at)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDuration(job.started_at, job.completed_at)}</TableCell>
                  <TableCell className="text-right text-foreground">{job.articles_found ?? '-'}</TableCell>
                  <TableCell className="text-right text-success-text font-medium">{job.articles_new ?? '-'}</TableCell>
                  <TableCell className="text-right text-info-text">{job.articles_updated ?? '-'}</TableCell>
                  <TableCell className="text-right text-info-text">{job.embeddings_generated ?? '-'}</TableCell>
                  <TableCell className="text-destructive-text text-xs truncate max-w-xs">{job.error_message || '-'}</TableCell>
                </TableRow>
              ))}
              {jobList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    Nenhum job executado ainda
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Static Reference Tables */}
      <div className="px-6 py-4">
        <h2 className="text-base font-semibold text-foreground mb-3">Tabelas de Referência Estáticas</h2>
        <p className="text-xs text-muted-foreground mb-3">Tabelas normativas internas usadas pelo motor de regras para determinações fiscais.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { nome: 'CFOP de Entrada', desc: 'Mapa (finalidade × interestadual × ST) → CFOP de escrituração', norma: 'Ajuste SINIEF 07/01', itens: '24 combinações' },
            { nome: 'CST/CSOSN Crédito', desc: 'Elegibilidade de crédito ICMS por CST do emitente', norma: 'LC 87/96 Art. 20', itens: '12 CSTs + 7 CSOSNs' },
            { nome: 'ICMS Interestadual', desc: 'Alíquotas interestaduais e internas por UF de origem/destino', norma: 'Resolução SF 22/89 + EC 87/2015', itens: '27 UFs' },
            { nome: 'Monofásico PIS/COFINS', desc: 'NCMs sujeitos à tributação monofásica PIS/COFINS', norma: 'Lei 10.147/2000', itens: '~50 NCMs' },
            { nome: 'CST PIS/COFINS', desc: 'Código de Situação Tributária para PIS e COFINS', norma: 'IN RFB 1.009/2010', itens: '28 códigos' },
            { nome: 'TIPI / IPI', desc: 'Alíquotas IPI por classificação NCM (TIPI vigente)', norma: 'RIPI/2010 + Decreto TIPI', itens: 'Por NCM' },
            { nome: 'FCP por Produto', desc: 'Fundo de Combate à Pobreza por NCM e UF de destino', norma: 'EC 87/2015 + leis estaduais', itens: 'Por NCM×UF' },
            { nome: 'DIFAL Regras', desc: 'Cálculo DIFAL: base dupla vs simples por UF', norma: 'EC 87/2015 + LC 190/2022', itens: '27 UFs' },
            { nome: 'cBenef / UF', desc: 'Códigos de benefício fiscal válidos por UF', norma: 'Convênios CONFAZ + legislação estadual', itens: 'Por UF' },
            { nome: 'Protocolo ST', desc: 'Protocolos e convênios de substituição tributária entre UFs', norma: 'Convênios ICMS CONFAZ', itens: 'NCM×UF' },
            { nome: 'MVA / ST', desc: 'Margens de Valor Agregado para cálculo da ST', norma: 'Protocolos CONFAZ + COTEPE', itens: 'Por NCM×UF' },
            { nome: 'SPED Histórico', desc: 'Padrões derivados do SPED Fiscal da empresa (CFOP, CST, alíquotas)', norma: 'Dados declarados no SPED', itens: 'Por empresa' },
          ].map((t) => (
            <div key={t.nome} className="bg-card border border-border rounded-lg p-3 hover:border-primary/30 transition-colors">
              <div className="font-medium text-sm text-foreground mb-1">{t.nome}</div>
              <div className="text-xs text-muted-foreground mb-2 leading-relaxed">{t.desc}</div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="info" className="text-xs">{t.norma}</Badge>
                <Badge variant="secondary" className="text-xs">{t.itens}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, small }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <div className={`font-semibold text-foreground ${small ? 'text-base' : 'text-2xl'}`}>{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  )
}

// Job run status: completed=success, running=info, failed=destructive, pending=neutral
function JobStatusBadge({ status }) {
  const normalized = (status || '').toLowerCase()
  const variants = {
    completed: 'success',
    running: 'info',
    failed: 'destructive',
    pending: 'secondary',
  }
  return (
    <Badge variant={variants[normalized] || variants.pending}>
      {status || 'unknown'}
    </Badge>
  )
}
