import { Building2, ChevronDown, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Button,
  Checkbox,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from '@bhubai/bhub-design-system'

/**
 * Seletor de empresas MÚLTIPLO com busca embutida.
 *
 * - Permite marcar 2, 3 ou mais empresas (checkbox por linha).
 * - Campo de busca dentro do dropdown filtra por razão social / CNPJ.
 * - Fecha ao clicar fora. Estilizado para header escuro (Bushido Night).
 *
 * Props:
 *   companies   : [{ id, razao_social, cnpj, uf }]
 *   selectedIds : number[]  (vazio = todas)
 *   onChange    : (number[]) => void
 */
export default function MultiCompanySelect({ companies = [], selectedIds = [], onChange }) {
  const [open, setOpen] = useState(false)
  const [busca, setBusca] = useState('')

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return companies
    return companies.filter(
      (c) =>
        c.razao_social?.toLowerCase().includes(q) ||
        (c.cnpj || '').toLowerCase().includes(q),
    )
  }, [companies, busca])

  const label = useMemo(() => {
    if (selectedIds.length === 0) return 'Todas as empresas'
    if (selectedIds.length === 1) {
      const c = companies.find((x) => x.id === selectedIds[0])
      return c?.razao_social || '1 empresa'
    }
    return `${selectedIds.length} empresas`
  }, [selectedIds, companies])

  const toggle = (id) => {
    const set = new Set(selectedIds)
    set.has(id) ? set.delete(id) : set.add(id)
    onChange(Array.from(set))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto gap-2 bg-sidebar-accent border border-sidebar-border rounded-lg px-2.5 py-1 text-sm text-sidebar-foreground max-w-60 hover:bg-sidebar-accent transition-colors"
        >
          <Building2 className="w-4 h-4 text-sidebar-foreground/60 shrink-0" />
          <span className="truncate">{label}</span>
          {selectedIds.length > 0 ? (
            <X
              className="w-3.5 h-3.5 ml-auto shrink-0 text-sidebar-foreground/70 hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onChange([]) }}
            />
          ) : (
            <ChevronDown className="w-4 h-4 text-sidebar-foreground/60 shrink-0" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0 flex flex-col max-h-80">
        <Command shouldFilter={false}>
          <CommandInput
            value={busca}
            onValueChange={setBusca}
            placeholder="Buscar empresa ou CNPJ..."
            autoFocus
          />
          <CommandList className="flex-1">
            <CommandEmpty>
              {companies.length === 0 ? 'Carregando...' : 'Nenhuma empresa encontrada'}
            </CommandEmpty>
            {filtradas.map((c) => (
              <CommandItem
                key={c.id}
                value={String(c.id)}
                onSelect={() => toggle(c.id)}
                className="gap-3"
              >
                <Checkbox
                  checked={selectedIds.includes(c.id)}
                  onCheckedChange={() => toggle(c.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="min-w-0">
                  <span className="block truncate text-foreground">{c.razao_social}</span>
                  {c.cnpj && <span className="block text-xs text-muted-foreground">{c.cnpj}{c.uf ? ` · ${c.uf}` : ''}</span>}
                </span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
        {selectedIds.length > 0 && (
          <div className="px-3 py-2 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{selectedIds.length} selecionada(s)</span>
            <Button
              variant="ghost"
              size="xs"
              className="h-auto p-0 font-bold text-destructive hover:underline hover:bg-transparent"
              onClick={() => onChange([])}
            >
              Limpar
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
