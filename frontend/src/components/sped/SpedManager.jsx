import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Upload,
  FileText,
  FileCode2,
  Trash2,
  Download,
  Building2,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  ChevronUp,
} from 'lucide-react'
import {
  Button, IconButton, Tooltip, TooltipTrigger, TooltipContent, Badge, Spinner, Input,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@bhubai/bhub-design-system'
import { SPED_TABS } from '../../constants/spedTabs'
import { useSpedFiles, useUploadSped, useUploadSpedBatch, useDeleteSped } from '../../hooks/useSped'
import { useReinfFiles, useUploadReinf, useUploadReinfBatch, useDeleteReinf } from '../../hooks/useReinf'
import { useSimplesNacionalFiles, useUploadSimplesNacional, useUploadSimplesNacionalBatch, useDeleteSimplesNacional } from '../../hooks/useSimplesNacional'
import { useCompanies } from '../../hooks/useCompanies'
import { usePresignedUpload } from '../../hooks/usePresignedUpload'
import { api } from '../../api/client'
import Pagination from '../shared/Pagination'
import { useToast } from '../shared/Toast'

// Sentinel for "all companies" in the DS Select (Radix disallows an empty-string item value).
const ALL_COMPANIES_VALUE = '__all__'

function formatPeriod(start, end) {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${months[s.getMonth()]}/${s.getFullYear()} - ${months[e.getMonth()]}/${e.getFullYear()}`
}

// Mode is informational (industrial vs. commercial), not a status — use
// info for one and neutral warning-adjacent tone for the other to keep
// them visually distinguishable without implying error/success state.
function ModeBadge({ mode }) {
  if (!mode) return <span className="text-muted-foreground text-xs">-</span>
  const isIndustrial = mode === 'INDUSTRIAL'
  return (
    <Badge variant={isIndustrial ? 'info' : 'warning'}>
      {mode}
    </Badge>
  )
}

// Event type codes are categorical labels, not status — use a uniform
// neutral badge for all of them.
function EventTypeBadge({ type }) {
  return (
    <Badge variant="secondary">
      {type}
    </Badge>
  )
}

// Builds the toast message/description for a successful upload result,
// mirroring the content the old inline success banners used to show.
function buildUploadSuccessToast(result, { isSimplesNacional, isReinf, isContrib }) {
  if (isSimplesNacional && result.file_id) {
    return {
      message: 'Contexto Simples Nacional importado com sucesso',
      description: `Empresa: ${result.company_name} (${result.cnpj}) · Período: ${result.period_start} a ${result.period_end} · Itens: ${result.total_items} (Entradas: ${result.total_entradas}, Saídas: ${result.total_saidas})`,
    }
  }

  if (!isReinf && !isSimplesNacional && result.sped_file_id) {
    const label = result.sped_type === 'CONTRIBUICOES' ? 'EFD Contribuições' : 'SPED Fiscal'
    const counts = result.sped_type === 'CONTRIBUICOES'
      ? `NFs enriquecidas: ${result.enrichment?.invoices_enriched || 0} | Itens: ${result.enrichment?.items_enriched || 0}`
      : `NFs: ${result.counts?.invoices_c100 || 0} | Itens: ${result.counts?.items_c170 || 0}`
    return {
      message: `${label} importado com sucesso`,
      description: `Empresa: ${result.company_name} (${result.cnpj}) · Período: ${result.period}${result.computed_mode ? ` · Modo: ${result.computed_mode}` : ''} · ${counts}`,
    }
  }

  if (isReinf && result.reinf_file_id) {
    return {
      message: 'EFD-Reinf importado com sucesso',
      description: `Empresa: ${result.company_name} (${result.cnpj}) · Período: ${result.periodo_apuracao} · Eventos: ${result.events_parsed} · Tipos: ${result.event_types}`,
    }
  }

  if (result.sped) {
    const parts = []
    if (result.sped.files_processed > 0) {
      parts.push(`SPED processados: ${result.sped.files_processed}${result.sped.total_invoices > 0 ? ` (${result.sped.total_invoices} NFs)` : ''}`)
    }
    if (result.sped.files_skipped > 0) parts.push(`Ignorados (duplicados): ${result.sped.files_skipped}`)
    if (result.reinf.files_processed > 0) {
      parts.push(`Reinf processados: ${result.reinf.files_processed}${result.reinf.total_events > 0 ? ` (${result.reinf.total_events} eventos)` : ''}`)
    }
    if (result.sped.companies_created?.length > 0) {
      parts.push(`Empresas auto-cadastradas: ${result.sped.companies_created.map(c => c.razao_social).join(', ')}`)
    }
    if (result.errors?.length > 0) parts.push(`Erros (${result.errors.length}): ${result.errors.join('; ')}`)
    return { message: 'Upload em lote concluído', description: parts.join(' · ') }
  }

  if (result.files_processed !== undefined) {
    const parts = [`Arquivos processados: ${result.files_processed}`]
    if (result.files_skipped > 0) parts.push(`Ignorados (duplicados): ${result.files_skipped}`)
    if (result.total_invoices > 0) parts.push(`Total NFs importadas: ${result.total_invoices}`)
    if (result.total_events > 0) parts.push(`Total eventos: ${result.total_events}`)
    if (result.companies_created?.length > 0) {
      parts.push(`Empresas auto-cadastradas: ${result.companies_created.map(c => c.razao_social).join(', ')}`)
    }
    if (result.errors?.length > 0) parts.push(`Erros (${result.errors.length}): ${result.errors.join('; ')}`)
    return { message: 'Upload em lote concluído', description: parts.join(' · ') }
  }

  return { message: 'Upload concluído com sucesso' }
}

function parseEventTypesSummary(summary) {
  if (!summary) return []
  return summary.split(', ').map(part => {
    const m = part.match(/^(R-\d+)\((\d+)\)$/)
    return m ? { type: m[1], count: parseInt(m[2]) } : null
  }).filter(Boolean)
}

export default function SpedManager({ activeTab: activeTabProp, onTabChange }) {
  const toast = useToast()
  const [activeTabLocal, setActiveTabLocal] = useState('fiscal')
  const activeTab = activeTabProp ?? activeTabLocal
  const setActiveTab = (tab) => { setActiveTabLocal(tab); onTabChange?.(tab) }
  const isFiscal = activeTab === 'fiscal'
  const isContrib = activeTab === 'contrib'
  const isReinf = activeTab === 'reinf'
  const isSimplesNacional = activeTab === 'simples_nacional'

  // Filters
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  // Upload zone toggle
  const [showUpload, setShowUpload] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const fileInputRef = useRef(null)

  // Staged files for preview before upload
  const [stagedFiles, setStagedFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, uploading: false })

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Reset page on filter change
  useEffect(() => { setPage(1) }, [companyId, periodStart, periodEnd, activeTab])

  // Companies for dropdown
  const { data: companies = [] } = useCompanies()

  // Shared query params
  const queryParams = {
    search: debouncedSearch || undefined,
    companyId: companyId || undefined,
    periodStart: periodStart || undefined,
    periodEnd: periodEnd || undefined,
    page,
    pageSize,
  }

  // SPED Fiscal data — only fetch when tab is active
  const { data: spedData, isLoading: spedLoading, isError: spedError } = useSpedFiles(
    isFiscal ? { ...queryParams, spedType: 'FISCAL' } : { _enabled: false }
  )

  // EFD Contribuições data — only fetch when tab is active
  const { data: contribData, isLoading: contribLoading, isError: contribError } = useSpedFiles(
    isContrib ? { ...queryParams, spedType: 'CONTRIBUICOES' } : { _enabled: false }
  )

  // EFD-Reinf data — only fetch when tab is active
  const { data: reinfData, isLoading: reinfLoading, isError: reinfError } = useReinfFiles(
    isReinf ? queryParams : { _enabled: false }
  )

  // Simples Nacional data — only fetch when tab is active
  const { data: simplesData, isLoading: simplesLoading, isError: simplesError } = useSimplesNacionalFiles(
    isSimplesNacional ? queryParams : { _enabled: false }
  )

  const data = isFiscal ? spedData : isContrib ? contribData : isReinf ? reinfData : simplesData
  const isLoading = isFiscal ? spedLoading : isContrib ? contribLoading : isReinf ? reinfLoading : simplesLoading
  const isError = isFiscal ? spedError : isContrib ? contribError : isReinf ? reinfError : simplesError
  const items = data?.items || []
  const total = data?.total || 0
  const totalPages = data?.total_pages || 1

  // Mutations
  const uploadSpedMutation = useUploadSped()
  const uploadSpedBatchMutation = useUploadSpedBatch()
  const deleteSpedMutation = useDeleteSped()
  const uploadReinfMutation = useUploadReinf()
  const uploadReinfBatchMutation = useUploadReinfBatch()
  const deleteReinfMutation = useDeleteReinf()
  const uploadSNMutation = useUploadSimplesNacional()
  const uploadSNBatchMutation = useUploadSimplesNacionalBatch()
  const deleteSNMutation = useDeleteSimplesNacional()
  const uploadMutation = isSimplesNacional ? uploadSNMutation : isReinf ? uploadReinfMutation : uploadSpedMutation
  const uploadBatchMutation = isSimplesNacional ? uploadSNBatchMutation : isReinf ? uploadReinfBatchMutation : uploadSpedBatchMutation
  const deleteMutation = isSimplesNacional ? deleteSNMutation : isReinf ? deleteReinfMutation : deleteSpedMutation

  // Presigned URL upload hook (used for batch uploads to bypass API Gateway 10MB limit)
  const presignedUpload = usePresignedUpload({ concurrency: 3 })

  // Summary: count unique companies and S3 files from current page (total from server)
  const companiesInPage = new Set(items.map(f => f.company_id)).size
  const s3Count = items.filter(f => f.s3_key).length

  // Reset filtros/paginação sempre que o tipo de arquivo muda — seja pela
  // navegação da sidebar (prop controlada) ou por um toggle interno futuro.
  useEffect(() => {
    setSearch('')
    setDebouncedSearch('')
    setCompanyId('')
    setPeriodStart('')
    setPeriodEnd('')
    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const stageFiles = useCallback((files) => {
    const newFiles = Array.from(files).map((f) => ({
      file: f,
      id: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`,
      name: f.name,
      size: f.size,
      status: 'staged', // staged | uploading | done | error
      error: null,
    }))
    setStagedFiles((prev) => [...prev, ...newFiles])
  }, [])

  const removeStagedFile = useCallback((id) => {
    setStagedFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const handleUploadStaged = useCallback(
    async () => {
      if (stagedFiles.length === 0) return

      const filesToUpload = stagedFiles.filter((f) => f.status === 'staged')
      if (filesToUpload.length === 0) return

      // Use presigned upload flow (bypasses API Gateway 10MB limit)
      const uploadType = isSimplesNacional ? 'simples_nacional' : isReinf ? 'reinf' : 'sped'
      const payload = filesToUpload.map((sf) => ({
        file: sf.file,
        uploadType,
      }))

      // Mark all as uploading
      setStagedFiles((prev) => prev.map((f) =>
        filesToUpload.some((sf) => sf.id === f.id) ? { ...f, status: 'uploading' } : f
      ))
      setUploadProgress({ current: 0, total: filesToUpload.length, uploading: true })

      try {
        await presignedUpload.startUpload(payload)
      } catch (err) {
        // Error is also captured in presignedUpload.error
      }
    },
    [stagedFiles, isReinf, presignedUpload]
  )

  // Sync presigned upload state back to staged files UI
  useEffect(() => {
    if (presignedUpload.phase === 'idle') return

    if (presignedUpload.phase === 'done' && presignedUpload.result) {
      // Mark all staged files as done
      setStagedFiles((prev) => prev.map((f) =>
        f.status === 'uploading' ? { ...f, status: 'done' } : f
      ))
      setUploadProgress((prev) => ({ ...prev, uploading: false, current: prev.total }))
      const { message, description } = buildUploadSuccessToast(presignedUpload.result, { isSimplesNacional, isReinf, isContrib })
      toast.success(message, description ? { description } : undefined)

      // Clear staged files after short delay
      setTimeout(() => {
        setStagedFiles([])
        setShowUpload(false)
        presignedUpload.reset()
      }, 1500)
    }

    if (presignedUpload.phase === 'error') {
      setStagedFiles((prev) => prev.map((f) =>
        f.status === 'uploading' ? { ...f, status: 'error', error: presignedUpload.error } : f
      ))
      setUploadProgress((prev) => ({ ...prev, uploading: false }))
      toast.error('Erro no upload', { description: presignedUpload.error || 'Falha no upload' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presignedUpload.phase, presignedUpload.result, presignedUpload.error])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragActive(false)
      const files = Array.from(e.dataTransfer?.files || [])
      if (files.length > 0) stageFiles(files)
    },
    [stageFiles]
  )

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) stageFiles(files)
    e.target.value = ''
  }

  const handleDelete = async (fileId) => {
    try {
      await deleteMutation.mutateAsync(fileId)
      setDeleteConfirm(null)
    } catch {
      // error handled by react-query
    }
  }

  const handleDownload = async (fileId, filename) => {
    try {
      const blob = isSimplesNacional
        ? await api.downloadSimplesNacionalFile(fileId)
        : isReinf
          ? await api.downloadReinfFile(fileId)
          : await api.downloadSpedFile(fileId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silent fail for download
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="px-6 py-5 border-b border-border bg-muted flex items-center justify-between -mx-6 -mt-6 mb-6">
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Dados SPED — {SPED_TABS.find((t) => t.id === activeTab)?.label}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gerencie os arquivos SPED Fiscal, EFD Contribuicoes, EFD-Reinf e Contexto Simples Nacional
              </p>
            </div>
          </div>

          {/* Toolbar: Search + Filters + Upload toggle */}
          <div className="bg-card rounded-lg border border-border mb-4">
            <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-50">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                <Input
                  type="text"
                  placeholder="Buscar por empresa, arquivo ou CNPJ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Company filter */}
              <Select
                value={companyId || ALL_COMPANIES_VALUE}
                onValueChange={(v) => setCompanyId(v === ALL_COMPANIES_VALUE ? '' : v)}
              >
                <SelectTrigger className="min-w-45">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_COMPANIES_VALUE}>Todas as empresas</SelectItem>
                  {companies.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.razao_social}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Period range */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>De</span>
                <Input
                  type="month"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-auto"
                />
                <span>Ate</span>
                <Input
                  type="month"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-auto"
                />
              </div>

              {/* Upload toggle button */}
              <Button
                variant={showUpload ? 'secondary' : 'default'}
                onClick={() => setShowUpload(!showUpload)}
              >
                {showUpload ? <ChevronUp className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                Upload
              </Button>
            </div>

            {/* Upload Zone (collapsible) */}
            {showUpload && (
              <div className="border-t border-border px-4 py-4">
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-muted hover:border-muted-foreground'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    {isSimplesNacional
                      ? 'Arraste planilhas de contexto Simples Nacional (.xlsx) aqui'
                      : isReinf
                        ? 'Arraste um ou mais arquivos EFD-Reinf (.xml) aqui'
                        : isContrib
                          ? 'Arraste arquivos EFD Contribuições PIS/COFINS (.txt) aqui'
                          : 'Arraste arquivos SPED Fiscal ICMS/IPI (.txt) aqui'}
                  </p>
                  <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                    Selecionar arquivo(s)
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={isSimplesNacional ? '.xlsx,.xls' : isReinf ? '.xml' : '.txt'}
                    onChange={handleFileSelect}
                    className="hidden"
                    multiple
                  />
                </div>

                {/* Staged files preview */}
                {stagedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">
                        {stagedFiles.length} arquivo{stagedFiles.length > 1 ? 's' : ''} selecionado{stagedFiles.length > 1 ? 's' : ''}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => { setStagedFiles([]); presignedUpload.reset() }}
                          disabled={uploadProgress.uploading || presignedUpload.isUploading}
                        >
                          Limpar
                        </Button>
                        <Button
                          size="xs"
                          onClick={handleUploadStaged}
                          disabled={uploadProgress.uploading || presignedUpload.isUploading || stagedFiles.every(f => f.status !== 'staged')}
                        >
                          {(uploadProgress.uploading || presignedUpload.isUploading) ? (
                            <><Spinner size="xs" /> Enviando...</>
                          ) : (
                            <><Upload className="w-3 h-3" /> Enviar {stagedFiles.filter(f => f.status === 'staged').length} arquivo{stagedFiles.filter(f => f.status === 'staged').length > 1 ? 's' : ''}</>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Phase indicator */}
                    {presignedUpload.isUploading && (
                      <div className="flex items-center gap-2 text-xs font-medium text-primary">
                        <Spinner size="xs" />
                        {presignedUpload.phase === 'signing' && 'Gerando URLs...'}
                        {presignedUpload.phase === 'uploading' && 'Enviando arquivos...'}
                        {presignedUpload.phase === 'processing' && 'Processando...'}
                      </div>
                    )}
                    {presignedUpload.phase === 'done' && (
                      <div className="flex items-center gap-2 text-xs font-medium text-success-text">
                        <CheckCircle2 className="w-3 h-3" />
                        Concluido
                      </div>
                    )}

                    {/* Overall progress bar */}
                    {(presignedUpload.isUploading || uploadProgress.uploading) && (
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progresso geral</span>
                          <span>{Math.round(presignedUpload.overallProgress * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${presignedUpload.overallProgress * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* File list with per-file progress */}
                    <div className="border border-border rounded-lg divide-y divide-border max-h-48 overflow-y-auto">
                      {stagedFiles.map((sf) => {
                        const fileP = presignedUpload.fileProgress.get(sf.name)
                        const fileProgressValue = fileP?.progress || 0
                        const filePhase = fileP?.phase
                        const isFileUploading = filePhase === 'uploading'

                        return (
                          <div key={sf.id} className="px-3 py-2 text-xs">
                            <div className="flex items-center gap-3">
                              {sf.status === 'uploading' && !filePhase && <Spinner size="sm" className="text-primary shrink-0" />}
                              {filePhase === 'signing' && <Spinner size="sm" className="text-muted-foreground shrink-0" />}
                              {isFileUploading && <Spinner size="sm" className="text-primary shrink-0" />}
                              {filePhase === 'uploaded' && <CheckCircle2 className="w-3.5 h-3.5 text-info shrink-0" />}
                              {filePhase === 'processing' && <Spinner size="sm" className="text-warning shrink-0" />}
                              {(sf.status === 'done' || filePhase === 'done') && <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />}
                              {(sf.status === 'error' || filePhase === 'error') && <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />}
                              {sf.status === 'staged' && !filePhase && (
                                isReinf
                                  ? <FileCode2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                  : <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              )}
                              <span className="flex-1 text-foreground truncate" title={sf.name}>{sf.name}</span>
                              {isFileUploading && (
                                <span className="text-primary shrink-0">{Math.round(fileProgressValue * 100)}%</span>
                              )}
                              {!isFileUploading && (
                                <span className="text-muted-foreground shrink-0">{(sf.size / 1024).toFixed(0)} KB</span>
                              )}
                              {sf.status === 'staged' && !uploadProgress.uploading && !presignedUpload.isUploading && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <IconButton
                                      aria-label="Remover"
                                      variant="ghost"
                                      size="xs"
                                      className="text-muted-foreground hover:text-destructive shrink-0"
                                      onClick={() => removeStagedFile(sf.id)}
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </IconButton>
                                  </TooltipTrigger>
                                  <TooltipContent>Remover</TooltipContent>
                                </Tooltip>
                              )}
                              {(sf.status === 'error' || filePhase === 'error') && (
                                <span className="text-destructive-text truncate max-w-30" title={sf.error || fileP?.error}>
                                  {sf.error || fileP?.error}
                                </span>
                              )}
                            </div>
                            {/* Per-file progress bar */}
                            {isFileUploading && (
                              <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all duration-200"
                                  style={{ width: `${fileProgressValue * 100}%` }}
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Summary (inline compact) */}
          <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              {isReinf ? <FileCode2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              <span className="font-medium text-foreground">{total}</span> arquivo{total !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              <span className="font-medium text-foreground">{companiesInPage}</span> empresa{companiesInPage !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-4 h-4" />
              <span className="font-medium text-foreground">{s3Count}</span> no S3
            </span>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="xl" className="text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="bg-card rounded-lg border border-destructive-border p-12 text-center">
              <AlertCircle className="w-10 h-10 text-destructive/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {isSimplesNacional ? 'Erro ao carregar dados Simples Nacional' : isReinf ? 'Erro ao carregar dados Reinf' : isContrib ? 'Erro ao carregar dados EFD Contribuições' : 'Erro ao carregar dados SPED'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Verifique se o backend esta rodando e tente novamente</p>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              {isReinf
                ? <FileCode2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                : <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              }
              <p className="text-sm text-muted-foreground">
                {debouncedSearch || companyId || periodStart || periodEnd
                  ? 'Nenhum arquivo encontrado com os filtros aplicados'
                  : isSimplesNacional ? 'Nenhuma planilha Simples Nacional importada'
                    : isReinf ? 'Nenhum arquivo Reinf importado'
                      : isContrib ? 'Nenhum arquivo EFD Contribuições importado'
                        : 'Nenhum arquivo SPED importado'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {!debouncedSearch && !companyId && !periodStart && !periodEnd
                  ? (isSimplesNacional
                    ? 'Clique em Upload acima para importar uma planilha .xlsx'
                    : isReinf
                      ? 'Clique em Upload acima para importar um arquivo .xml'
                      : 'Clique em Upload acima para importar um arquivo .txt')
                  : 'Tente ajustar os filtros'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Periodo</TableHead>
                  {isSimplesNacional ? (
                    <>
                      <TableHead className="text-right">Entradas</TableHead>
                      <TableHead className="text-right">Saidas</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </>
                  ) : !isReinf ? (
                    <>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Modo</TableHead>
                      <TableHead className="text-right">NFs</TableHead>
                      <TableHead className="text-right">Itens</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead className="text-right">Eventos</TableHead>
                      <TableHead>Tipos</TableHead>
                    </>
                  )}
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-foreground font-medium text-xs truncate max-w-45" title={f.company_name}>
                          {f.company_name}
                        </span>
                        <span className="text-muted-foreground text-xs">{f.company_cnpj}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isReinf
                          ? <FileCode2 className="w-4 h-4 text-muted-foreground shrink-0" />
                          : <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        }
                        <span className="text-foreground truncate max-w-50" title={f.filename}>
                          {f.filename}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {isReinf
                        ? f.periodo_apuracao
                        : formatPeriod(f.period_start, f.period_end)}
                    </TableCell>
                    {isSimplesNacional ? (
                      <>
                        <TableCell className="text-right text-muted-foreground tabular-nums">{f.total_entradas}</TableCell>
                        <TableCell className="text-right text-muted-foreground tabular-nums">{f.total_saidas}</TableCell>
                        <TableCell className="text-right text-muted-foreground tabular-nums font-medium">{f.total_items}</TableCell>
                      </>
                    ) : !isReinf ? (
                      <>
                        <TableCell>
                          {f.sped_type === 'CONTRIBUICOES' ? (
                            <Badge variant="outline">PIS/COFINS</Badge>
                          ) : (
                            <Badge variant="outline">ICMS/IPI</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {f.sped_type === 'CONTRIBUICOES'
                            ? <span className="text-xs text-muted-foreground">-</span>
                            : <ModeBadge mode={f.computed_mode} />
                          }
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground tabular-nums">
                          {f.sped_type === 'CONTRIBUICOES'
                            ? `${(f.total_c100 || 0) + (f.total_a100 || 0)}`
                            : f.total_c100?.toLocaleString('pt-BR') ?? '-'
                          }
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground tabular-nums">
                          {f.sped_type === 'CONTRIBUICOES'
                            ? `${(f.total_c170 || 0) + (f.total_a170 || 0)}`
                            : f.total_0200?.toLocaleString('pt-BR') ?? '-'
                          }
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="text-right text-muted-foreground tabular-nums">
                          {f.total_events}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {parseEventTypesSummary(f.event_types_summary).map(({ type, count }) => (
                              <EventTypeBadge key={type} type={`${type}(${count})`} />
                            ))}
                          </div>
                        </TableCell>
                      </>
                    )}
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {f.s3_key && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <IconButton
                                aria-label="Download"
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-info hover:bg-info-subtle"
                                onClick={() => handleDownload(f.id, f.filename)}
                              >
                                <Download className="w-4 h-4" />
                              </IconButton>
                            </TooltipTrigger>
                            <TooltipContent>Download</TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <IconButton
                              aria-label="Excluir"
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive-subtle"
                              onClick={() => setDeleteConfirm({ ...f, _type: isSimplesNacional ? 'simples_nacional' : isReinf ? 'reinf' : 'fiscal' })}
                            >
                              <Trash2 className="w-4 h-4" />
                            </IconButton>
                          </TooltipTrigger>
                          <TooltipContent>Excluir</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Pagination (sticky bottom) */}
      {items.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={(open) => { if (!open && !deleteMutation.isPending) setDeleteConfirm(null) }}
      >
        <DialogContent
          className="sm:max-w-lg"
          showCloseButton={!deleteMutation.isPending}
          onPointerDownOutside={(e) => { if (deleteMutation.isPending) e.preventDefault() }}
          onEscapeKeyDown={(e) => { if (deleteMutation.isPending) e.preventDefault() }}
        >
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          {deleteConfirm && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Deseja excluir o arquivo <span className="font-medium">{deleteConfirm.filename}</span>?
              </p>
              <p className="text-xs text-muted-foreground">
                {deleteConfirm._type === 'simples_nacional'
                  ? 'Todos os itens do contexto Simples Nacional serao excluidos permanentemente.'
                  : deleteConfirm._type === 'reinf'
                    ? 'Todos os eventos Reinf associados serao excluidos permanentemente.'
                    : 'Os dados SPED serao removidos. As notas fiscais serao mantidas e desvinculadas deste arquivo.'}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)} disabled={deleteMutation.isPending}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDelete(deleteConfirm.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Spinner size="sm" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
