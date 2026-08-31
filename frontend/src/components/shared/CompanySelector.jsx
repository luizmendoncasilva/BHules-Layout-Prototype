import { Building2 } from 'lucide-react'
import { useEffect } from 'react'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@bhubai/bhub-design-system'
import { useCompanies } from '../../hooks/useCompanies'
import { useCompany } from '../../context/CompanyContext'

export default function CompanySelector() {
  const { data: companies, isLoading } = useCompanies()
  const { companyId, companyName, selectCompany } = useCompany()

  // Auto-select first company
  useEffect(() => {
    if (companies?.length && !companyId) {
      selectCompany(companies[0].id, companies[0].razao_social)
    }
  }, [companies, companyId, selectCompany])

  if (isLoading) return <div className="px-4 py-2 text-sm text-muted-foreground">Carregando...</div>

  const handleValueChange = (value) => {
    const c = companies?.find((x) => String(x.id) === value)
    if (c) selectCompany(c.id, c.razao_social)
  }

  return (
    <Select
      isDeselectable={false}
      value={companyId != null ? String(companyId) : ''}
      onValueChange={handleValueChange}
    >
      <SelectTrigger className="max-w-xs">
        <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
        <SelectValue>
          <span className="truncate">{companyName || 'Selecionar empresa'}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="w-80 max-h-60">
        {companies?.map((c) => (
          <SelectItem key={c.id} value={String(c.id)}>
            <span className="flex flex-col min-w-0">
              <span className="font-medium truncate">{c.razao_social}</span>
              <span className="text-xs text-muted-foreground mt-0.5">{c.cnpj} - {c.uf}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
