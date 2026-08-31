import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import * as Icons from '@/src/icons'
import { SearchIcon } from '@/src/icons'
import { useState, useCallback } from 'react'

import { Input } from '@/components/ui/input'

// Lucide icons are forwardRef objects: { $$typeof, render: fn }.
// We match exports ending in "Icon" that have this exact shape.
const isIconComponent = (value: unknown): value is React.FC<Icons.LucideProps> =>
  typeof value === 'object' &&
  value !== null &&
  '$$typeof' in value &&
  'render' in value &&
  typeof (value as { render: unknown }).render === 'function'

const ALL_ICONS = Object.entries(Icons).filter(
  ([name, value]) => name !== 'Icon' && name.endsWith('Icon') && isIconComponent(value)
) as [string, React.FC<Icons.LucideProps>][]

function IconGallery() {
  const [query, setQuery] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const filtered = query.trim()
    ? ALL_ICONS.filter(([name]) =>
        name.toLowerCase().includes(query.toLowerCase())
      )
    : ALL_ICONS

  const handleCopy = useCallback((name: string) => {
    navigator.clipboard.writeText(name)
    setCopied(name)
    setTimeout(() => setCopied(null), 1500)
  }, [])

  return (
    <div className="flex flex-col gap-4 p-4 w-full">
      <div className="flex items-center gap-2">
        <div className="relative w-72">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
          <Input
            className="pl-9"
            placeholder="Buscar ícone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {filtered.length} de {ALL_ICONS.length} ícones
        </span>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
        {filtered.map(([name, Icon]) => (
          <button
            key={name}
            onClick={() => handleCopy(name)}
            title={`Copiar: ${name}`}
            className="group flex flex-col items-center gap-2 rounded-lg border border-border p-3 text-center transition-colors hover:bg-accent hover:border-ring cursor-pointer"
          >
            <Icon className="size-6 text-foreground shrink-0" />
            <span className="text-xs text-muted-foreground leading-tight break-all group-hover:text-foreground transition-colors">
              {copied === name ? '✓ copiado!' : name.replace(/Icon$/, '')}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-12">
          Nenhum ícone encontrado para &quot;{query}&quot;
        </p>
      )}
    </div>
  )
}

const meta = {
  title: 'BSystem/Icons',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Galeria de todos os ícones disponíveis via `lucide-react`. Clique em um ícone para copiar o nome do componente.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  name: 'Galeria',
  render: () => <IconGallery />,
}