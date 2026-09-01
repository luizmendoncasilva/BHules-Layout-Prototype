import { useEffect, useState } from 'react'
import { useHasRole, ROLE_FISCAL_ADM } from '../../auth/roles'
import {
  Scale, FileText, Database, UserPlus, Cloud,
  Layers, Settings2, Stethoscope, Coins, FileStack, PieChart, History, Gavel,
  ChevronsLeft, ChevronsRight, ChevronDown, ScrollText, Landmark, BarChart3, Activity,
  Truck, ShoppingCart,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { IconButton, Tooltip, TooltipTrigger, TooltipContent } from '@bhubai/bhub-design-system'
import BHubLogo from '../shared/BHubLogo'
import { api } from '../../api/client'
import { INTEGRADAS_TABS } from '../../constants/integradasTabs'
import { SPED_TABS } from '../../constants/spedTabs'
import { NOTAS_FISCAIS_GROUPS, CTE_GROUPS, NFC_TABS } from '../../constants/notasFiscaisTabs'

export const CRAWLER_TABS = [
  { id: 'NFE', label: 'Leis Federais e Estaduais', icon: ScrollText },
  { id: 'NFSE', label: 'Leis Federais e Municipais', icon: Landmark },
]

export const BHUBTAX_TABS = [
  { id: 'dados', label: 'Dados das Notas', icon: FileText },
  { id: 'operacional', label: 'Visão Operacional', icon: Activity },
  { id: 'indicadores', label: 'Indicadores', icon: BarChart3 },
  { id: 'legislacao', label: 'Legislação', icon: Scale },
]

function NavItem({ icon: Icon, label, isActive, onClick, badge, expanded, chevronOpen }) {
  const hasChevron = chevronOpen !== undefined
  const button = (
    <button
      onClick={onClick}
      className={[
        'relative flex items-center gap-2.5 rounded-lg transition-colors w-full',
        expanded ? 'px-2.5 py-2' : 'p-2 justify-center',
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
      ].join(' ')}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {expanded && <span className="text-sm truncate flex-1 text-left">{label}</span>}
      {expanded && badge > 0 && (
        <span className="w-4.5 h-4.5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center px-1 pointer-events-none shrink-0">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      {expanded && hasChevron && (
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 text-sidebar-foreground/60 transition-transform duration-150 ${chevronOpen ? '' : '-rotate-90'}`}
        />
      )}
      {!expanded && badge > 0 && (
        <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center px-1 pointer-events-none shrink-0">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  )

  if (expanded) return button

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

// Item de navegação com sub-telas. Clicar no item só expande/colapsa a
// lista de sub-telas abaixo dele (como um accordion) — não navega sozinho.
// A navegação acontece ao clicar numa sub-tela específica. Quando o módulo
// já está ativo (ex: veio de outro lugar do app), a lista abre sozinha.
function ExpandableNavItem({ icon, label, view, tabs, currentView, subView, expanded, onNavigate, setExpanded }) {
  const isActive = currentView === view
  const [open, setOpen] = useState(isActive)

  useEffect(() => {
    if (isActive) setOpen(true)
  }, [isActive])

  return (
    <div>
      <NavItem
        expanded={expanded}
        icon={icon}
        label={label}
        isActive={isActive}
        chevronOpen={open}
        onClick={() => {
          if (!expanded) {
            setExpanded(true)
            setOpen(true)
            onNavigate?.(view, subView || tabs[0].id)
            return
          }
          setOpen((v) => !v)
        }}
      />
      {expanded && open && (
        <div className="ml-4 pl-3 border-l border-sidebar-border flex flex-col gap-0.5 mt-0.5 mb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onNavigate?.(view, tab.id)}
              className={[
                'flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors text-left',
                isActive && subView === tab.id
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              ].join(' ')}
            >
              <tab.icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Um nó da árvore abaixo do módulo (ex: "Materiais NF-e" ou "Emitidas"
// dentro dele): tem `tabs` (é folha — lista de sub-telas navegáveis) OU
// `groups` (aninha mais um nível — chama a si mesmo recursivamente). Nunca
// os dois. Cada nó controla seu próprio open/close, então a árvore aceita
// qualquer profundidade sem precisar de um componente por nível.
function containsSubView(node, subView) {
  if (node.tabs) return node.tabs.some((t) => t.id === subView)
  return (node.groups || []).some((g) => containsSubView(g, subView))
}

function TreeGroup({ node, isActive, subView, onNavigate, view, depth }) {
  const active = isActive && containsSubView(node, subView)
  const [open, setOpen] = useState(active)

  useEffect(() => {
    if (active) setOpen(true)
  }, [active])

  const borderCls = depth > 1 ? 'border-sidebar-border/60' : 'border-sidebar-border'

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors text-left w-full text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <node.icon className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate flex-1">{node.label}</span>
        <ChevronDown
          className={`w-3 h-3 shrink-0 text-sidebar-foreground/60 transition-transform duration-150 ${open ? '' : '-rotate-90'}`}
        />
      </button>
      {open && (
        <div className={`ml-4 pl-3 border-l ${borderCls} flex flex-col gap-0.5 mt-0.5 mb-1`}>
          {node.tabs && node.tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onNavigate?.(view, tab.id)}
              className={[
                'flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors text-left',
                isActive && subView === tab.id
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              ].join(' ')}
            >
              <tab.icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
          {node.groups && node.groups.map((g) => (
            <TreeGroup key={g.id} node={g} isActive={isActive} subView={subView} onNavigate={onNavigate} view={view} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

// Igual ao ExpandableNavItem, mas o conteúdo é uma árvore (via TreeGroup)
// em vez de uma lista achatada — usado onde a segregação precisa agrupar
// sub-telas por tipo de documento (e às vezes por mais um nível ainda,
// ex: Emitidas/Recebidas) antes de chegar na direção (Entrada/Saída).
function NestedExpandableNavItem({ icon, label, view, groups, isActive, subView, expanded, onNavigate, setExpanded, badge }) {
  const [open, setOpen] = useState(isActive)

  useEffect(() => {
    if (isActive) setOpen(true)
  }, [isActive])

  const firstLeafId = (node) => (node.tabs ? node.tabs[0].id : firstLeafId(node.groups[0]))

  return (
    <div>
      <NavItem
        expanded={expanded}
        icon={icon}
        label={label}
        isActive={isActive}
        chevronOpen={open}
        badge={badge}
        onClick={() => {
          if (!expanded) {
            setExpanded(true)
            setOpen(true)
            onNavigate?.(view, subView || firstLeafId(groups[0]))
            return
          }
          setOpen((v) => !v)
        }}
      />
      {expanded && open && (
        <div className="ml-4 pl-3 border-l border-sidebar-border flex flex-col gap-0.5 mt-0.5 mb-1">
          {groups.map((group) => (
            <TreeGroup key={group.id} node={group} isActive={isActive} subView={subView} onNavigate={onNavigate} view={view} depth={1} />
          ))}
        </div>
      )}
    </div>
  )
}

function Divider() {
  return <div className="h-px bg-sidebar-border my-1 mx-2" />
}

export default function Sidebar({ currentView, subViews = {}, onNavigate }) {
  const isFiscalAdm = useHasRole(ROLE_FISCAL_ADM)
  const [expanded, setExpanded] = useState(false)

  const { data: statusCounts } = useQuery({
    queryKey: ['statusCounts', '55'],
    queryFn: () => api.getStatusCounts(undefined, '55'),
    refetchInterval: 60000,
  })

  const reviewCount = (statusCounts?.REQUER_REVISAO || 0) + (statusCounts?.BLOQUEADO || 0)

  return (
    <div
      className={[
        'h-full bg-sidebar border-r border-sidebar-border flex flex-col justify-between z-30 shrink-0 transition-[width] duration-200 ease-linear overflow-hidden',
        expanded ? 'w-60' : 'w-18',
      ].join(' ')}
    >
      {/* Top: Logo + toggle + Nav */}
      <div className="flex flex-col gap-1 px-2.5 py-4 overflow-y-auto min-h-0">
        <div className={`flex items-center mb-1 ${expanded ? 'justify-between px-1' : 'flex-col gap-1 justify-center'}`}>
          <div className="flex items-center gap-2 min-w-0">
            <IconButton
              aria-label="Motor de Regras"
              variant="ghost"
              onClick={() => onNavigate?.('list')}
              className="rounded-xl text-sidebar-foreground hover:bg-sidebar-accent shrink-0 w-10 h-10"
            >
              <BHubLogo className="w-8 h-8" color="currentColor" />
            </IconButton>
            {expanded && <span className="font-semibold text-sidebar-foreground truncate text-base">BHules</span>}
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton
                aria-label={expanded ? 'Recolher menu' : 'Expandir menu'}
                variant="ghost"
                onClick={() => setExpanded((v) => !v)}
                className="text-sidebar-foreground hover:bg-sidebar-accent shrink-0"
              >
                {expanded ? <ChevronsLeft className="w-4 h-4" /> : <ChevronsRight className="w-4 h-4" />}
              </IconButton>
            </TooltipTrigger>
            <TooltipContent side="right">{expanded ? 'Recolher menu' : 'Expandir menu'}</TooltipContent>
          </Tooltip>
        </div>

        <Divider />

        <NestedExpandableNavItem
          icon={FileText} label="Notas Fiscais" view="list" groups={NOTAS_FISCAIS_GROUPS}
          isActive={currentView === 'list' || currentView === 'detail'} subView={subViews.list} expanded={expanded}
          onNavigate={onNavigate} setExpanded={setExpanded} badge={reviewCount}
        />

        <NestedExpandableNavItem
          icon={Truck} label="CT-e" view="cte" groups={CTE_GROUPS}
          isActive={currentView === 'cte'} subView={subViews.cte} expanded={expanded}
          onNavigate={onNavigate} setExpanded={setExpanded}
        />

        <ExpandableNavItem
          icon={ShoppingCart} label="NFC-e" view="nfc" tabs={NFC_TABS}
          currentView={currentView} subView={subViews.nfc} expanded={expanded}
          onNavigate={onNavigate} setExpanded={setExpanded}
        />

        <NavItem expanded={expanded} icon={Layers} label="Resolução em Lote" isActive={currentView === 'batch'} onClick={() => onNavigate?.('batch')} />

        <ExpandableNavItem
          icon={FileStack} label="Notas Integradas" view="integradas" tabs={INTEGRADAS_TABS}
          currentView={currentView} subView={subViews.integradas} expanded={expanded}
          onNavigate={onNavigate} setExpanded={setExpanded}
        />

        <ExpandableNavItem
          icon={Scale} label="Legislação" view="crawler" tabs={CRAWLER_TABS}
          currentView={currentView} subView={subViews.crawler} expanded={expanded}
          onNavigate={onNavigate} setExpanded={setExpanded}
        />

        <NavItem expanded={expanded} icon={Gavel} label="Alertas Tributários" isActive={currentView === 'tax-alerts'} onClick={() => onNavigate?.('tax-alerts')} />

        <ExpandableNavItem
          icon={Database} label="Dados SPED" view="sped" tabs={SPED_TABS}
          currentView={currentView} subView={subViews.sped} expanded={expanded}
          onNavigate={onNavigate} setExpanded={setExpanded}
        />

        <ExpandableNavItem
          icon={PieChart} label="BHub Tax" view="bhubtax" tabs={BHUBTAX_TABS}
          currentView={currentView} subView={subViews.bhubtax} expanded={expanded}
          onNavigate={onNavigate} setExpanded={setExpanded}
        />

        <NavItem expanded={expanded} icon={History} label="Auditoria" isActive={currentView === 'audit'} onClick={() => onNavigate?.('audit')} />

        {isFiscalAdm && (
          <>
            <Divider />
            <NavItem expanded={expanded} icon={Stethoscope} label="Diagnóstico Fiscal" isActive={currentView === 'diagnosis'} onClick={() => onNavigate?.('diagnosis')} />
            <NavItem expanded={expanded} icon={Coins} label="Recuperação de Créditos" isActive={currentView === 'recovery'} onClick={() => onNavigate?.('recovery')} />
            <NavItem expanded={expanded} icon={Cloud} label="Captura de Notas" isActive={currentView === 'capture'} onClick={() => onNavigate?.('capture')} />
            <NavItem expanded={expanded} icon={UserPlus} label="Habilitar Clientes" isActive={currentView === 'onboarding'} onClick={() => onNavigate?.('onboarding')} />
            <NavItem expanded={expanded} icon={Settings2} label="Regras CFOP" isActive={currentView === 'cfop-rules'} onClick={() => onNavigate?.('cfop-rules')} />
          </>
        )}
      </div>
    </div>
  )
}
