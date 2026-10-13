import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  Building2,
  Search,
  ChevronDown,
  X,
  Check,
  Filter,
  CheckCircle2,
} from 'lucide-react'
import { formatCnpj, normalizeCnpj } from '../../utils/cnpj'
import { Badge, IconButton } from '@bhubai/bhub-design-system'

export function SeletorEmpresaCombobox({
  companies = [],
  selectedCompanyId = null,
  onSelectCompany,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all' | 'simples' | 'nfse'

  const containerRef = useRef(null)
  const searchInputRef = useRef(null)

  // Empresa selecionada
  const selectedCompany = useMemo(() => {
    if (!selectedCompanyId) return null
    return companies.find((c) => String(c.id) === String(selectedCompanyId)) || null
  }, [companies, selectedCompanyId])

  // Contagem de Simples Nacional no conjunto
  const countSimples = useMemo(() => {
    return companies.filter((c) => c.regime_tributario === 'SIMPLES').length
  }, [companies])

  // Fecha ao clicar fora
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // Auto-foca no campo de busca ao abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  // Filtro de empresas com busca por nome ou CNPJ
  const filteredCompanies = useMemo(() => {
    const rawSearch = searchTerm.trim().toLowerCase()
    const cleanSearch = normalizeCnpj(rawSearch)

    return companies.filter((c) => {
      // Filtro de aba / categoria
      if (filterType === 'simples' && c.regime_tributario !== 'SIMPLES') {
        return false
      }
      if (filterType === 'nfse' && !c.nfse_servicos_enabled) {
        return false
      }

      if (!rawSearch) return true

      // Busca por Razão Social ou Nome Fantasia
      const matchRazao = c.razao_social?.toLowerCase().includes(rawSearch)
      const matchFantasia = c.nome_fantasia?.toLowerCase().includes(rawSearch)
      if (matchRazao || matchFantasia) return true

      // Busca por CNPJ formatado ou apenas dígitos/alfanumérico
      const cCnpj = normalizeCnpj(c.cnpj)
      if (cleanSearch && cCnpj.includes(cleanSearch)) return true

      return false
    })
  }, [companies, searchTerm, filterType])

  // Limita a exibição a 150 itens para máxima performance no DOM
  const displayedCompanies = useMemo(() => {
    return filteredCompanies.slice(0, 150)
  }, [filteredCompanies])

  const handleSelect = (id) => {
    onSelectCompany?.(id)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Botão Gatilho */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm bg-card border rounded-md transition-all text-left shadow-xs focus:outline-none focus:ring-1 focus:ring-primary ${
          isOpen
            ? 'border-primary ring-1 ring-primary/30'
            : 'border-border hover:border-input'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        style={{ minWidth: '280px', maxWidth: '420px' }}
      >
        <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />

        <div className="flex-1 min-w-0 pr-1">
          {selectedCompany ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-foreground truncate">
                {selectedCompany.razao_social || 'Empresa sem nome'}
              </span>
              <span className="text-xs font-mono text-muted-foreground shrink-0">
                {formatCnpj(selectedCompany.cnpj)}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground font-medium">Selecione uma empresa...</span>
          )}
        </div>

        {selectedCompany?.regime_tributario === 'SIMPLES' && (
          <Badge variant="success" className="hidden sm:inline-flex px-1.5 text-[10px] font-bold uppercase">
            Simples
          </Badge>
        )}

        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${
            isOpen ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {/* Dropdown Flutuante */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-[360px] sm:w-[460px] bg-card border border-border rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
          {/* Campo de Busca */}
          <div className="p-3 border-b border-border bg-muted/70">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por razão social ou CNPJ..."
                className="w-full pl-9 pr-8 py-1.5 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-xs"
              />
              {searchTerm && (
                <IconButton
                  type="button"
                  aria-label="Limpar busca"
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setSearchTerm('')
                    searchInputRef.current?.focus()
                  }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </IconButton>
              )}
            </div>

            {/* Abas Rápidas de Filtro */}
            <div className="flex items-center gap-1.5 mt-2.5 text-xs">
              <span className="text-muted-foreground text-[11px] font-medium mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filtrar:
              </span>
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2 py-0.5 rounded-full font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'bg-muted text-muted-foreground hover:bg-border'
                }`}
              >
                Todas ({companies.length})
              </button>
              {countSimples > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterType('simples')}
                  className={`px-2 py-0.5 rounded-full font-medium transition-colors flex items-center gap-1 ${
                    filterType === 'simples'
                      ? 'bg-success text-success-foreground font-semibold'
                      : 'bg-success-subtle text-success-text border border-success-border hover:bg-success-subtle'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Simples Nacional ({countSimples})
                </button>
              )}
              <button
                type="button"
                onClick={() => setFilterType('nfse')}
                className={`px-2 py-0.5 rounded-full font-medium transition-colors ${
                  filterType === 'nfse'
                    ? 'bg-info text-info-foreground font-semibold'
                    : 'bg-info-subtle text-info-text border border-info-border hover:bg-info-subtle'
                }`}
              >
                Com NFS-e
              </button>
            </div>
          </div>

          {/* Lista de Empresas */}
          <div className="max-h-72 overflow-y-auto divide-y divide-border">
            {displayedCompanies.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                Nenhuma empresa encontrada com os filtros atuais.
              </div>
            ) : (
              displayedCompanies.map((c) => {
                const isSelected = String(c.id) === String(selectedCompanyId)
                const isSimples = c.regime_tributario === 'SIMPLES'

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelect(c.id)}
                    className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-3 hover:bg-info-subtle transition-colors group ${
                      isSelected ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-medium truncate ${
                            isSelected
                              ? 'text-primary font-semibold'
                              : 'text-foreground group-hover:text-primary'
                          }`}
                        >
                          {c.razao_social || 'Sem Razão Social'}
                        </span>
                        {isSimples && (
                          <Badge variant="success" className="px-1.5 py-0 text-[10px] font-semibold">
                            Simples
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground font-mono">
                        <span>{formatCnpj(c.cnpj)}</span>
                        {c.uf && (
                          <span className="font-sans px-1 rounded bg-muted text-muted-foreground text-[10px]">
                            {c.uf}
                          </span>
                        )}
                        {c.codigo_dominio && (
                          <span className="font-sans text-[11px] text-muted-foreground">
                            Domínio: {c.codigo_dominio}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-primary shrink-0" />
                    )}
                  </button>
                )
              })
            )}
          </div>

          {/* Rodapé Informativo */}
          <div className="px-3.5 py-2 bg-muted border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              Mostrando {displayedCompanies.length} de {filteredCompanies.length}{' '}
              {filteredCompanies.length === 1 ? 'empresa' : 'empresas'}
            </span>
            {filteredCompanies.length > displayedCompanies.length && (
              <span className="text-muted-foreground">Digite para refinar a busca</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SeletorEmpresaCombobox
