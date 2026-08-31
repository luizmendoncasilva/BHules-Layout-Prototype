import { useState } from 'react'
import { Building2, ChevronDown, X } from 'lucide-react'
import {
  Button, IconButton, Popover, PopoverTrigger, PopoverContent,
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from '@bhubai/bhub-design-system'

/**
 * Searchable company combobox, shared between diagnosis screens
 * (ReformDiagnosis, CompanyDiagnosis). Built on top of the design system's
 * Popover + Command primitives instead of a hand-rolled dropdown.
 */
export default function CompanySearchSelect({ companies, selected, onChange, className = '' }) {
  const [open, setOpen] = useState(false)

  const selectedName = selected
    ? (companies.find((c) => String(c.id) === String(selected))?.razao_social || `Empresa ${selected}`)
    : ''

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`min-w-72 max-w-96 justify-between font-normal ${className}`}
        >
          <span className="flex items-center gap-2 flex-1 min-w-0">
            <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="truncate text-left flex-1 text-foreground">{selectedName || 'Selecione uma empresa'}</span>
          </span>
          {selected && (
            <IconButton
              aria-label="Limpar selecao"
              variant="ghost"
              size="xs"
              onClick={(e) => { e.stopPropagation(); onChange('') }}
            >
              <X className="w-3.5 h-3.5" />
            </IconButton>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar empresa..." />
          <CommandList>
            <CommandEmpty>Nenhuma empresa encontrada</CommandEmpty>
            <CommandGroup>
              {companies.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.razao_social || c.nome_fantasia || `Empresa ${c.id}`}
                  onSelect={() => { onChange(String(c.id)); setOpen(false) }}
                >
                  {c.razao_social || c.nome_fantasia || `Empresa ${c.id}`}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
