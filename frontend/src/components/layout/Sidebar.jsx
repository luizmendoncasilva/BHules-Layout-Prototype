import { useMemo } from 'react'
import { useHasRole, ROLE_FISCAL_ADM } from '../../auth/roles'
import { useAuth } from '../../auth/useAuth'
import {
  Scale, FileText, Database, UserPlus, Cloud,
  Layers, Settings2, FileStack, History, Gavel,
  ScrollText, Landmark, BarChart3, Activity,
  Truck, ShoppingCart, ClipboardCheck, ListChecks, BookOpenCheck,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { AppSidebar, BHubLogoFull, BHubLogoIcon } from '@bhubai/bhub-design-system'
import { api } from '../../api/client'
import { INTEGRADAS_GROUPS } from '../../constants/integradasTabs'
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

// Primeira sub-tela (folha) de uma lista de nós `groups`/`tabs` — destino do
// clique num módulo com a sidebar colapsada.
const firstLeafId = (nodes) => {
  const node = nodes[0]
  if (node.tabs) return node.tabs[0].id
  if (node.groups) return firstLeafId(node.groups)
  return node.id
}

// Converte a árvore de sub-telas do app (nós com `tabs` = folha, nós com
// `groups` = mais um nível — ver notasFiscaisTabs.js) para os `items`
// aninhados do NavMain do DS. Clicar num grupo só abre/fecha; clicar numa
// folha navega para (view, tab.id).
function toNavTree(nodes, { view, active, subView, onNavigate }) {
  return nodes.map((node) => {
    if (node.tabs || node.groups) {
      return {
        id: `${view}:${node.id}`,
        title: node.label,
        icon: node.icon,
        items: [
          ...toNavTree(node.tabs || [], { view, active, subView, onNavigate }),
          ...toNavTree(node.groups || [], { view, active, subView, onNavigate }),
        ],
      }
    }
    return {
      id: `${view}:${node.id}`,
      title: node.label,
      icon: node.icon,
      isActive: active && subView === node.id,
      onClick: () => onNavigate?.(view, node.id),
    }
  })
}

// Sidebar da casca do app — AppSidebar do design system (feat/sidebar-v2,
// trazido para a cópia local do DS). O estado colapsado/expandido vem do
// SidebarProvider (App.jsx) e é alternado pelo SidebarTrigger do AppHeader,
// pelo rail da borda ou por Ctrl/Cmd+B.
export default function Sidebar({ currentView, subViews = {}, onNavigate }) {
  const isFiscalAdm = useHasRole(ROLE_FISCAL_ADM)
  const { user, logout } = useAuth()

  const { data: statusCounts } = useQuery({
    queryKey: ['statusCounts', '55'],
    queryFn: () => api.getStatusCounts(undefined, '55'),
    refetchInterval: 60000,
  })

  const reviewCount = (statusCounts?.REQUER_REVISAO || 0) + (statusCounts?.BLOQUEADO || 0)

  const navGroups = useMemo(() => {
    // Módulo com sub-telas: no modo expandido o clique só abre/fecha a lista;
    // com a sidebar colapsada, expande a sidebar e navega para a sub-tela
    // atual do módulo (ou a primeira).
    const moduleItem = ({ view, title, icon, tree, isActive, badge }) => ({
      id: view,
      title,
      icon,
      badge,
      isActive,
      onClick: () => onNavigate?.(view, subViews[view] || firstLeafId(tree)),
      items: toNavTree(tree, { view, active: isActive, subView: subViews[view], onNavigate }),
    })
    const leafItem = (view, title, icon) => ({
      id: view,
      title,
      icon,
      isActive: currentView === view,
      onClick: () => onNavigate?.(view),
    })
    const groups = [
      {
        label: 'Documentos fiscais',
        items: [
          moduleItem({
            view: 'list', title: 'Notas Fiscais', icon: FileText, tree: NOTAS_FISCAIS_GROUPS,
            isActive: currentView === 'list' || currentView === 'detail', badge: reviewCount,
          }),
          moduleItem({ view: 'cte', title: 'CT-e', icon: Truck, tree: CTE_GROUPS, isActive: currentView === 'cte' }),
          moduleItem({ view: 'nfc', title: 'NFC-e', icon: ShoppingCart, tree: NFC_TABS, isActive: currentView === 'nfc' }),
          leafItem('batch', 'Resolução em Lote', Layers),
          moduleItem({ view: 'integradas', title: 'Notas Integradas', icon: FileStack, tree: INTEGRADAS_GROUPS, isActive: currentView === 'integradas' }),
          // NFS-e — Dashboard + Conferência (worklist de falso-negativo)
          leafItem('nfse', 'NFS-e — Dashboard e Conferência', ClipboardCheck),
        ],
      },
      {
        label: 'Regras e conformidade',
        items: [
          // Fila DIFAL-SN (RN-25) — vereditos da Célula sobre o DIFAL do Simples
          leafItem('difal-fila', 'Fila DIFAL-SN', ListChecks),
          moduleItem({ view: 'crawler', title: 'Legislação', icon: Scale, tree: CRAWLER_TABS, isActive: currentView === 'crawler' }),
          leafItem('tax-alerts', 'Alertas Tributários', Gavel),
          moduleItem({ view: 'sped', title: 'Dados SPED', icon: Database, tree: SPED_TABS, isActive: currentView === 'sped' }),
          // BHub Tax — desabilitado em 24/09/2026 a pedido da operação (igual
          // ao oficial). A view `bhubtax` continua no App.jsx; para religar,
          // voltar um moduleItem com view 'bhubtax' e tree BHUBTAX_TABS.
          leafItem('audit', 'Auditoria', History),
          // Regras DIFAL-SN — leitura do Rule Pack com o gate de ativação (DV5-11)
          leafItem('difal-regras', 'Regras DIFAL-SN', BookOpenCheck),
        ],
      },
    ]

    if (isFiscalAdm) {
      // Diagnóstico Fiscal e Recuperação de Créditos saíram do menu no
      // oficial (#716) — as views seguem no App.jsx.
      groups.push({
        label: 'Administração',
        items: [
          leafItem('capture', 'Captura de Notas', Cloud),
          leafItem('onboarding', 'Habilitar Clientes', UserPlus),
          leafItem('cfop-rules', 'Regras CFOP', Settings2),
        ],
      })
    }
    return groups
  }, [currentView, subViews, onNavigate, reviewCount, isFiscalAdm])

  const goHome = () => onNavigate?.('list')

  return (
    <AppSidebar
      navGroups={navGroups}
      workspaces={null}
      user={user ? { name: user.name || user.email || 'Usuário', email: user.email || '', avatar: user.picture } : null}
      userActions={[]}
      onLogout={() => logout?.({ logoutParams: { returnTo: window.location.origin } })}
      logo={{
        expandedLogo: (
          <button
            type="button"
            onClick={goHome}
            aria-label="Motor de Regras — página inicial"
            className="flex items-center gap-3 cursor-pointer text-sidebar-accent-foreground"
          >
            <BHubLogoFull className="h-6 w-auto" />
            <span className="h-5 w-px bg-sidebar-border" />
            <span className="text-sm font-semibold tracking-wide">BHules</span>
          </button>
        ),
        collapsedLogo: (
          <button
            type="button"
            onClick={goHome}
            aria-label="Motor de Regras — página inicial"
            className="cursor-pointer text-sidebar-accent-foreground"
          >
            <BHubLogoIcon className="size-8 shrink-0" />
          </button>
        ),
      }}
    />
  )
}
