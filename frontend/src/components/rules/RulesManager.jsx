import { useState, useMemo } from 'react'
import { BookOpen, Search, Filter, AlertTriangle, ShieldAlert, Shield, Info, Lightbulb, Ban } from 'lucide-react'
import { Badge, Button, Input, Select, SelectTrigger, SelectContent, SelectItem, SelectValue, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Spinner } from '@bhubai/bhub-design-system'
import { useRulesCatalog } from '../../hooks/useRules'

// Sentinel values for the "all" options in DS Select (Radix disallows value="").
const ALL_STEPS = '__all_steps__'
const ALL_SEVERITIES = '__all_severities__'

const SEVERITY_CONFIG = {
  BLOQUEIO:       { label: 'Bloqueio',       variant: 'destructive', icon: Ban },
  ALERTA_CRITICO: { label: 'Alerta Crítico', variant: 'destructive', icon: ShieldAlert },
  ALERTA:         { label: 'Alerta',         variant: 'warning', icon: AlertTriangle },
  OPORTUNIDADE:   { label: 'Oportunidade',   variant: 'success', icon: Lightbulb },
  SUGESTAO:       { label: 'Sugestão',       variant: 'info', icon: Info },
  INFORMATIVO:    { label: 'Informativo',    variant: 'secondary', icon: Info },
}

const STEP_LABELS = {
  0: 'Precondições',
  1: 'Gatekeeper',
  2: 'Cenários',
  3: 'NCM',
  4: 'CST/CSOSN',
  5: 'CFOP',
  6: 'ICMS',
  7: 'ST/Benefícios',
  8: 'Créditos Federais',
  9: 'Validação Documental',
}

function SeverityBadge({ severity }) {
  const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.INFORMATIVO
  const Icon = cfg.icon
  return (
    <Badge variant={cfg.variant} className="whitespace-nowrap">
      <Icon className="w-3 h-3" />
      {cfg.label}
    </Badge>
  )
}

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-foreground text-2xl">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  )
}

export default function RulesManager() {
  const { data, isLoading } = useRulesCatalog()
  const [searchText, setSearchText] = useState('')
  const [filterStep, setFilterStep] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('')

  const rules = useMemo(() => {
    if (!data?.rules) return []
    return data.rules.filter((r) => {
      if (filterStep !== '' && r.step !== Number(filterStep)) return false
      if (filterSeverity && r.severity !== filterSeverity) return false
      if (searchText) {
        const q = searchText.toLowerCase()
        return (
          r.rule_code.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.field.toLowerCase().includes(q) ||
          r.legislation.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [data, searchText, filterStep, filterSeverity])

  // Unique steps and severities present in the data
  const steps = useMemo(() => {
    if (!data?.rules) return []
    const set = new Set(data.rules.map((r) => r.step))
    return [...set].sort((a, b) => a - b)
  }, [data])

  const severities = useMemo(() => {
    if (!data?.rules) return []
    const set = new Set(data.rules.map((r) => r.severity))
    return [...set]
  }, [data])

  return (
    <div className="flex flex-col h-full bg-background overflow-auto">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-muted">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Regras de Negócio</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Catálogo completo de regras do motor de validação fiscal
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-6 py-5 grid grid-cols-4 gap-4">
        <SummaryCard
          icon={BookOpen}
          label="Total de Regras"
          value={isLoading ? '...' : (data?.total_rules ?? 0).toLocaleString('pt-BR')}
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Total de Disparos"
          value={isLoading ? '...' : (data?.total_fires ?? 0).toLocaleString('pt-BR')}
        />
        <SummaryCard
          icon={Shield}
          label="Regras Filtradas"
          value={rules.length.toLocaleString('pt-BR')}
        />
        <SummaryCard
          icon={Filter}
          label="Steps Cobertos"
          value={steps.length.toLocaleString('pt-BR')}
        />
      </div>

      {/* Filters */}
      <div className="px-6 pb-4 flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
          <Input
            type="text"
            placeholder="Buscar por código, descrição, campo ou legislação..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Step filter */}
        <Select
          value={filterStep === '' ? ALL_STEPS : String(filterStep)}
          onValueChange={(v) => setFilterStep(v === ALL_STEPS ? '' : v)}
        >
          <SelectTrigger className="min-w-45">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STEPS}>Todos os Steps</SelectItem>
            {steps.map((s) => (
              <SelectItem key={s} value={String(s)}>
                Step {s} — {STEP_LABELS[s] || `Step ${s}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Severity filter */}
        <Select
          value={filterSeverity === '' ? ALL_SEVERITIES : filterSeverity}
          onValueChange={(v) => setFilterSeverity(v === ALL_SEVERITIES ? '' : v)}
        >
          <SelectTrigger className="min-w-45">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SEVERITIES}>Todas as Severidades</SelectItem>
            {severities.map((s) => (
              <SelectItem key={s} value={s}>
                {SEVERITY_CONFIG[s]?.label || s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear filters */}
        {(searchText || filterStep !== '' || filterSeverity) && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearchText('')
              setFilterStep('')
              setFilterSeverity('')
            }}
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="px-6 pb-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-24 text-muted-foreground gap-2">
            <Spinner size="sm" />
            Carregando regras...
          </div>
        ) : (
          <Table className="text-sm">
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Step</TableHead>
                <TableHead>Severidade</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Campo</TableHead>
                <TableHead>Legislação</TableHead>
                <TableHead className="text-right">Disparos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.rule_code}>
                  <TableCell>
                    <span className="font-mono font-semibold text-foreground text-xs bg-muted px-1.5 py-0.5 rounded">
                      {rule.rule_code}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-foreground font-medium">{rule.step_name}</div>
                    <div className="text-xs text-muted-foreground">Step {rule.step}</div>
                  </TableCell>
                  <TableCell>
                    <SeverityBadge severity={rule.severity} />
                  </TableCell>
                  <TableCell className="text-foreground max-w-sm whitespace-normal">
                    {rule.description}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {rule.field}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-62 whitespace-normal">
                    {rule.legislation}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-semibold tabular-nums ${rule.fire_count > 0 ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                      {rule.fire_count.toLocaleString('pt-BR')}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {rules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    Nenhuma regra encontrada para os filtros selecionados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
