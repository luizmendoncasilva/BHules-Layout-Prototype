import { useState, useEffect, useCallback } from 'react'
import { Search, UserPlus, Building2, CheckCircle2, XCircle, Loader2, ChevronRight, MapPin, FileText, ToggleLeft, ToggleRight, ShieldCheck, ShieldX, ShieldAlert, Shield, FileCheck, Receipt, RefreshCw, AlertTriangle, ArrowRight, Upload, Database, Zap, Trash2 } from 'lucide-react'
import {
  Button, IconButton, Tooltip, TooltipTrigger, TooltipContent,
  Badge, Checkbox, Input, Label, Card,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Command, CommandList, CommandItem,
} from '@bhubai/bhub-design-system'
import { api } from '../../api/client'
import Pagination from '../shared/Pagination'
import DeleteCompanyModal from './DeleteCompanyModal'
import { normalizeCnpj } from '../../utils/cnpj'
import { useToast } from '../shared/Toast'

const TAX_TYPE_LABELS = {
  MENSAL_PROFIT: 'Lucro Real',
  REAL_PROFIT: 'Lucro Real',
  PRESUMED_PROFIT: 'Lucro Presumido',
  NATIONAL_SIMPLE: 'Simples Nacional',
  SIMPLES_NACIONAL: 'Simples Nacional',
  MEI: 'MEI',
}

const ATIVIDADE_OPTIONS = [
  { value: 'INDUSTRIA', label: 'Industria' },
  { value: 'COMERCIO', label: 'Comercio' },
  { value: 'SERVICOS', label: 'Servicos' },
  { value: 'AGRO', label: 'Agronegocio' },
  { value: 'TRANSPORTE', label: 'Transporte' },
]

function debounce(fn, ms) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

export default function ClientOnboarding() {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState(null)
  const [atividade, setAtividade] = useState('')
  const [nfeEnabled, setNfeEnabled] = useState(true)
  const [nfseEnabled, setNfseEnabled] = useState(false)
  const [enabling, setEnabling] = useState(false)
  const [companies, setCompanies] = useState([])
  const [totalCompanies, setTotalCompanies] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [companyPage, setCompanyPage] = useState(1)
  const [companyPageSize, setCompanyPageSize] = useState(50)
  const [companySearch, setCompanySearch] = useState('')
  const [debouncedCompanySearch, setDebouncedCompanySearch] = useState('')
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [togglingId, setTogglingId] = useState(null)
  const [togglingTypeId, setTogglingTypeId] = useState(null)
  const [syncingCerts, setSyncingCerts] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null) // empresa selecionada pra deletar

  const toast = useToast()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCompanySearch(companySearch)
      setCompanyPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [companySearch])

  const loadCompanies = useCallback(() => {
    setLoadingCompanies(true)
    api.getOnboardedCompanies({ search: debouncedCompanySearch || undefined, page: companyPage, pageSize: companyPageSize })
      .then(data => {
        setCompanies(data.items || [])
        setTotalCompanies(data.total || 0)
        setTotalPages(data.total_pages || 1)
      })
      .catch(() => {})
      .finally(() => setLoadingCompanies(false))
  }, [debouncedCompanySearch, companyPage, companyPageSize])

  useEffect(() => { loadCompanies() }, [loadCompanies])

  const handleSyncCertificates = async () => {
    setSyncingCerts(true)
    try {
      await api.syncCertificates()
      loadCompanies()
    } catch (e) {
      console.error('Certificate sync error:', e)
    } finally {
      setSyncingCerts(false)
    }
  }

  const doSearch = useCallback(
    debounce(async (q) => {
      if (!q || q.length < 2) { setResults([]); return }
      setSearching(true)
      try {
        const data = await api.searchCockpit(q)
        setResults(data.results || [])
      } catch (e) {
        console.error('Search error:', e)
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 400),
    [],
  )

  useEffect(() => { doSearch(search) }, [search])

  const handleEnable = async () => {
    if (!selected) return
    if (!nfeEnabled && !nfseEnabled) return
    setEnabling(true)
    try {
      const res = await api.enableCompany({
        guid: selected.guid,
        corporate_name: selected.corporate_name,
        cnpj: selected.cnpj,
        company_tax_type: selected.company_tax_type,
        state_registration: selected.state_registration,
        uf: selected.uf,
        city: selected.city,
        city_ibge_code: selected.city_ibge_code,
        atividade_principal: atividade || null,
        nfe_entrada_enabled: nfeEnabled,
        nfse_servicos_enabled: nfseEnabled,
      })
      let description
      if (res.company_id) {
        const meta = `ID: ${res.company_id}${res.regime_tributario ? ` | Regime: ${res.regime_tributario}` : ''}${res.uf ? ` | UF: ${res.uf}` : ''}`
        description = res.status === 'error'
          ? meta
          : `${meta}. Proximo passo: faca o upload do SPED Fiscal para ativar a captura automatica.`
      }
      if (res.status === 'already_exists') {
        toast.warning(res.message, { description })
      } else {
        toast.success(res.message, { description })
      }
      setSelected(null)
      setSearch('')
      setResults([])
      setNfeEnabled(true)
      setNfseEnabled(false)
      loadCompanies()
    } catch (e) {
      toast.error(e.message || 'Erro ao habilitar empresa')
    } finally {
      setEnabling(false)
    }
  }

  const handleToggleActive = async (company) => {
    setTogglingId(company.id)
    try {
      await api.toggleCompanyActive(company.id, !company.ativo)
      setCompanies(prev =>
        prev.map(c => c.id === company.id ? { ...c, ativo: !c.ativo } : c)
      )
    } catch (e) {
      console.error('Toggle error:', e)
    } finally {
      setTogglingId(null)
    }
  }

  const handleToggleTypeFlag = async (company, flag) => {
    const key = `${company.id}-${flag}`
    setTogglingTypeId(key)
    const newValue = !company[flag]
    try {
      await api.updateCompanyTypeFlags(company.id, { [flag]: newValue })
      setCompanies(prev =>
        prev.map(c => c.id === company.id ? { ...c, [flag]: newValue } : c)
      )
    } catch (e) {
      console.error('Toggle type flag error:', e)
    } finally {
      setTogglingTypeId(null)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-muted flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Habilitar Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">Busque no Cockpit BHub e habilite novas empresas no motor de regras</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Search */}
        <Card padding="none" className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Buscar no Cockpit BHub</h3>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Razao social ou CNPJ..."
              className="pl-10 pr-4"
            />
            {searching && <Loader2 className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground animate-spin" />}
          </div>

          {/* Results */}
          {results.length > 0 && (
            <Command shouldFilter={false} className="mt-3 rounded-lg border border-border">
              <CommandList className="max-h-64">
                {results.map(r => (
                  <CommandItem
                    key={r.guid}
                    value={r.guid}
                    onSelect={() => setSelected(r)}
                    className={`px-4 py-3 flex items-center justify-between ${
                      selected?.guid === r.guid ? 'bg-accent border-l-2 border-primary' : ''
                    }`}
                  >
                    <div>
                      <div className="text-sm font-medium text-foreground">{r.corporate_name}</div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span>{formatCnpj(r.cnpj)}</span>
                        {r.uf && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{r.uf}</span>}
                        {r.company_tax_type && <span>{TAX_TYPE_LABELS[r.company_tax_type] || r.company_tax_type}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={r.status === 'active' ? 'success' : 'secondary'}>
                        {r.status === 'active' ? 'Ativo' : r.status}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          )}

          {search.length >= 2 && !searching && results.length === 0 && (
            <p className="mt-3 text-sm text-muted-foreground text-center py-4">Nenhum resultado encontrado</p>
          )}
        </Card>

        {/* Selected Company — Onboard Form */}
        {selected && (
          <Card padding="none" className="p-5 border-info-border">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" /> Habilitar Empresa
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label className="text-xs text-muted-foreground">Razao Social</Label>
                <p className="text-sm font-medium text-foreground">{selected.corporate_name}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">CNPJ</Label>
                <p className="text-sm font-medium text-foreground">{formatCnpj(selected.cnpj)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Regime Tributario</Label>
                <p className="text-sm font-medium text-foreground">{TAX_TYPE_LABELS[selected.company_tax_type] || selected.company_tax_type || '—'}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">UF</Label>
                <p className="text-sm font-medium text-foreground">{selected.uf || '—'}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Inscricao Estadual</Label>
                <p className="text-sm font-medium text-foreground">{selected.state_registration || '—'}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Cidade</Label>
                <p className="text-sm font-medium text-foreground">{selected.city || '—'}</p>
              </div>
            </div>

            <div className="mb-4">
              <Label htmlFor="atividade-principal" className="text-xs text-muted-foreground mb-1 block">Atividade Principal</Label>
              <Select value={atividade} onValueChange={setAtividade}>
                <SelectTrigger id="atividade-principal" className="w-full">
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  {ATIVIDADE_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Invoice Type Selection */}
            <div className="mb-4">
              <Label className="text-xs text-muted-foreground mb-2 block">Tipos de Nota para Captura</Label>
              <div className="flex items-center gap-6">
                <Label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={nfeEnabled}
                    onCheckedChange={(v) => setNfeEnabled(!!v)}
                  />
                  <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
                    <FileCheck className="w-4 h-4 text-info-text" />
                    NF-e de Entrada
                  </span>
                </Label>
                <Label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={nfseEnabled}
                    onCheckedChange={(v) => setNfseEnabled(!!v)}
                  />
                  <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
                    <Receipt className="w-4 h-4 text-magic-bold" />
                    NFS-e Servicos Tomados
                  </span>
                </Label>
              </div>
              {!nfeEnabled && !nfseEnabled && (
                <p className="text-xs text-destructive-text mt-1">Selecione ao menos um tipo de nota</p>
              )}
            </div>

            <Button
              onClick={handleEnable}
              disabled={enabling || (!nfeEnabled && !nfseEnabled)}
            >
              {enabling ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Habilitar no Motor de Regras
            </Button>
          </Card>
        )}

        {/* Flow explanation */}
        <Card padding="none" className="bg-info-subtle border-info-border p-5">
          <h3 className="text-sm font-semibold text-info-text mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Fluxo de Ativacao do Cliente
          </h3>
          <div className="flex items-center gap-3 text-xs text-info-text">
            <div className="flex flex-col items-center gap-1 text-center min-w-20">
              <div className="w-8 h-8 rounded-full bg-info-subtle border-2 border-info-border flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
              <span className="font-medium">1. Cadastro</span>
              <span className="text-info-text">Habilitar aqui</span>
            </div>
            <ArrowRight className="w-4 h-4 text-info-border shrink-0" />
            <div className="flex flex-col items-center gap-1 text-center min-w-20">
              <div className="w-8 h-8 rounded-full bg-info-subtle border-2 border-info-border flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <span className="font-medium">2. SPED Fiscal</span>
              <span className="text-info-text">Upload do arquivo</span>
            </div>
            <ArrowRight className="w-4 h-4 text-info-border shrink-0" />
            <div className="flex flex-col items-center gap-1 text-center min-w-20">
              <div className="w-8 h-8 rounded-full bg-info-subtle border-2 border-info-border flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <span className="font-medium">3. Historico</span>
              <span className="text-info-text">Automatico</span>
            </div>
            <ArrowRight className="w-4 h-4 text-info-border shrink-0" />
            <div className="flex flex-col items-center gap-1 text-center min-w-20">
              <div className="w-8 h-8 rounded-full bg-info-subtle border-2 border-info-border flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <span className="font-medium">4. Captura</span>
              <span className="text-info-text">Automatico</span>
            </div>
            <ArrowRight className="w-4 h-4 text-info-border shrink-0" />
            <div className="flex flex-col items-center gap-1 text-center min-w-20">
              <div className="w-8 h-8 rounded-full bg-success-subtle border-2 border-success-border flex items-center justify-center">
                <Zap className="w-4 h-4 text-success-text" />
              </div>
              <span className="font-medium">5. Motor</span>
              <span className="text-info-text">Automatico</span>
            </div>
          </div>
          <p className="text-xs text-info-text mt-3">
            Apos o upload do SPED, o sistema constroi o historico do cliente, dispara a primeira captura de notas e o motor de regras passa a rodar automaticamente.
          </p>
        </Card>

        {/* Existing Companies */}
        <Card padding="none" className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" /> Empresas Habilitadas ({totalCompanies})
            </h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar empresa ou CNPJ..."
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                className="pl-8 pr-3 h-8 text-xs w-64"
              />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSyncCertificates}
                  disabled={syncingCerts}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingCerts ? 'animate-spin' : ''}`} />
                  {syncingCerts ? 'Sincronizando...' : 'Atualizar Certificados'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Atualizar status dos certificados digitais via Cockpit</TooltipContent>
            </Tooltip>
          </div>

          {loadingCompanies ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              <Table className="text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-2">Empresa</TableHead>
                    <TableHead className="px-2">CNPJ</TableHead>
                    <TableHead className="px-2">UF</TableHead>
                    <TableHead className="px-2">Regime</TableHead>
                    <TableHead className="px-2">Atividade</TableHead>
                    <TableHead className="px-2 text-center">
                      <span className="flex items-center justify-center gap-1"><FileCheck className="w-3.5 h-3.5" />NF-e</span>
                    </TableHead>
                    <TableHead className="px-2 text-center">
                      <span className="flex items-center justify-center gap-1"><Receipt className="w-3.5 h-3.5" />NFS-e</span>
                    </TableHead>
                    <TableHead className="px-2 text-center">SPED Fiscal</TableHead>
                    <TableHead className="px-2 text-center">SPED Reinf</TableHead>
                    <TableHead className="px-2 text-center">EFD Contrib.</TableHead>
                    <TableHead className="px-2 text-center">Ctx. Simples</TableHead>
                    <TableHead className="px-2 text-center">Captura</TableHead>
                    <TableHead className="px-2 text-center">Certificado Digital</TableHead>
                    <TableHead className="px-2 text-center">
                      <span className="flex items-center justify-center gap-1"><Zap className="w-3.5 h-3.5" />Motor</span>
                    </TableHead>
                    <TableHead className="px-2 text-center">
                      <span className="flex items-center justify-center gap-1"><Shield className="w-3.5 h-3.5" />Recuperacao</span>
                    </TableHead>
                    <TableHead className="px-2 text-center">Ativo</TableHead>
                    <TableHead className="px-2 text-center">Excluir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="px-2 font-medium text-foreground">{c.razao_social}</TableCell>
                      <TableCell className="px-2 text-muted-foreground">{formatCnpj(c.cnpj)}</TableCell>
                      <TableCell className="px-2 text-muted-foreground">{c.uf || '—'}</TableCell>
                      <TableCell className="px-2 text-muted-foreground">{c.regime_tributario || '—'}</TableCell>
                      <TableCell className="px-2 text-muted-foreground">{c.atividade_principal || '—'}</TableCell>
                      <TableCell className="px-2 text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <IconButton
                              aria-label={c.nfe_entrada_enabled ? 'Desabilitar NF-e Entrada' : 'Habilitar NF-e Entrada'}
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleTypeFlag(c, 'nfe_entrada_enabled')}
                              disabled={togglingTypeId === `${c.id}-nfe_entrada_enabled`}
                            >
                              {c.nfe_entrada_enabled
                                ? <ToggleRight className="w-6 h-6 text-info-text" />
                                : <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                              }
                            </IconButton>
                          </TooltipTrigger>
                          <TooltipContent>{c.nfe_entrada_enabled ? 'Desabilitar NF-e Entrada' : 'Habilitar NF-e Entrada'}</TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="px-2 text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <IconButton
                              aria-label={c.nfse_servicos_enabled ? 'Desabilitar NFS-e Servicos' : 'Habilitar NFS-e Servicos'}
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleTypeFlag(c, 'nfse_servicos_enabled')}
                              disabled={togglingTypeId === `${c.id}-nfse_servicos_enabled`}
                            >
                              {c.nfse_servicos_enabled
                                ? <ToggleRight className="w-6 h-6 text-magic-bold" />
                                : <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                              }
                            </IconButton>
                          </TooltipTrigger>
                          <TooltipContent>{c.nfse_servicos_enabled ? 'Desabilitar NFS-e Servicos' : 'Habilitar NFS-e Servicos'}</TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="px-2 text-center">
                        {c.nfe_entrada_enabled ? (
                          c.sped_count > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs text-success-text font-medium" title={`${c.sped_count} arquivo(s) SPED ICMS/IPI`}>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {c.sped_count}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-warning-text" title="SPED ICMS/IPI pendente — necessario para motor NF-e">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Pendente
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground" title="NF-e desabilitada">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-2 text-center">
                        {c.nfse_servicos_enabled ? (
                          (c.reinf_count || 0) > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs text-success-text font-medium" title={`${c.reinf_count} arquivo(s) SPED Reinf`}>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {c.reinf_count}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-warning-text" title="SPED Reinf pendente — necessario para motor NFS-e">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Pendente
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground" title="NFS-e desabilitada">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-2 text-center">
                        {(c.efd_contribuicoes_count || 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs text-success-text font-medium" title={`${c.efd_contribuicoes_count} arquivo(s) EFD Contribuicoes`}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {c.efd_contribuicoes_count}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" title="EFD Contribuicoes nao enviada">
                            <XCircle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-2 text-center">
                        {(c.simples_nacional_count || 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs text-success-text font-medium" title={`${c.simples_nacional_count} arquivo(s) contexto Simples Nacional`}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {c.simples_nacional_count}
                          </span>
                        ) : (
                          c.regime_tributario === 'SIMPLES' || c.regime_tributario === 'MEI' ? (
                            <span className="inline-flex items-center gap-1 text-xs text-warning-text" title="Contexto Simples Nacional pendente">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Pendente
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground" title="Nao aplicavel (nao e Simples Nacional)">—</span>
                          )
                        )}
                      </TableCell>
                      <TableCell className="px-2 text-center">
                        {c.last_capture_sync_at ? (
                          <span className="inline-flex items-center gap-1 text-xs text-success-text" title={`Ultima captura: ${formatDate(c.last_capture_sync_at?.slice(0, 10))}`}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" title="Captura sera ativada apos upload do SPED">
                            <XCircle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-2 text-center">
                        <CertificateBadge company={c} />
                      </TableCell>
                      <TableCell className="px-2 text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <IconButton
                              aria-label={c.motor_regras_enabled ? 'Desativar Motor de Regras' : 'Ativar Motor de Regras'}
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleTypeFlag(c, 'motor_regras_enabled')}
                              disabled={togglingTypeId === `${c.id}-motor_regras_enabled`}
                            >
                              {c.motor_regras_enabled
                                ? <ToggleRight className="w-6 h-6 text-success-text" />
                                : <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                              }
                            </IconButton>
                          </TooltipTrigger>
                          <TooltipContent>{c.motor_regras_enabled ? 'Desativar Motor de Regras' : 'Ativar Motor de Regras'}</TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="px-2 text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <IconButton
                              aria-label={c.recuperacao_tributaria_enabled ? 'Desativar Recuperacao Tributaria' : 'Ativar Recuperacao Tributaria'}
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleTypeFlag(c, 'recuperacao_tributaria_enabled')}
                              disabled={togglingTypeId === `${c.id}-recuperacao_tributaria_enabled`}
                            >
                              {c.recuperacao_tributaria_enabled
                                ? <ToggleRight className="w-6 h-6 text-warning-text" />
                                : <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                              }
                            </IconButton>
                          </TooltipTrigger>
                          <TooltipContent>{c.recuperacao_tributaria_enabled ? 'Desativar Recuperacao Tributaria' : 'Ativar Recuperacao Tributaria'}</TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="px-2 text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <IconButton
                              aria-label={c.ativo !== false ? 'Desativar empresa' : 'Ativar empresa'}
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(c)}
                              disabled={togglingId === c.id}
                            >
                              {c.ativo !== false
                                ? <ToggleRight className="w-6 h-6 text-success-text" />
                                : <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                              }
                            </IconButton>
                          </TooltipTrigger>
                          <TooltipContent>{c.ativo !== false ? 'Desativar empresa' : 'Ativar empresa'}</TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="px-2 text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <IconButton
                              aria-label="Excluir empresa e apagar todos os dados"
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteTarget(c)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </IconButton>
                          </TooltipTrigger>
                          <TooltipContent>Excluir empresa e apagar todos os dados</TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                page={companyPage}
                totalPages={totalPages}
                totalItems={totalCompanies}
                pageSize={companyPageSize}
                onPageChange={setCompanyPage}
                onPageSizeChange={(size) => { setCompanyPageSize(size); setCompanyPage(1) }}
              />
            </div>
          )}
        </Card>
      </div>

      <DeleteCompanyModal
        company={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => {
          setDeleteTarget(null)
          loadCompanies()
        }}
      />
    </div>
  )
}

function CertificateBadge({ company: c }) {
  if (!c.certificado_cadastrado) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" title="Sem certificado digital">
        <ShieldX className="w-4 h-4" />
      </span>
    )
  }

  const days = c.certificado_dias_restantes
  const venc = c.certificado_vencimento

  if (c.certificado_status === 'VENCIDO') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-destructive-text" title={`Certificado vencido em ${formatDate(venc)}`}>
        <ShieldX className="w-4 h-4" />
        <span className="hidden xl:inline">Vencido</span>
      </span>
    )
  }

  if (c.certificado_status === 'VENCE_EM_BREVE') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-warning-text" title={`Vence em ${days} dias (${formatDate(venc)})`}>
        <ShieldAlert className="w-4 h-4" />
        <span className="hidden xl:inline">{days}d</span>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-success-text" title={`Valido ate ${formatDate(venc)} (${days} dias)`}>
      <ShieldCheck className="w-4 h-4" />
      <span className="hidden xl:inline">{days}d</span>
    </span>
  )
}

function formatDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function formatCnpj(cnpj) {
  // CNPJ alfanumérico (RFB jul/2026): normalizeCnpj preserva letras.
  if (!cnpj) return '—'
  const d = normalizeCnpj(cnpj)
  if (d.length !== 14) return cnpj
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`
}
