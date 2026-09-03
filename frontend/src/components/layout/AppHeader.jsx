import { useState } from 'react'
import { Bell, LogOut, XCircle, AlertTriangle, ShieldAlert, DollarSign, Clock } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import {
  IconButton, Tooltip, TooltipTrigger, TooltipContent, Button, Dialog, DialogContent, DialogTitle,
  Popover, PopoverTrigger, PopoverContent,
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from '@bhubai/bhub-design-system'
import { useAuth } from '../../auth/useAuth'
import { api } from '../../api/client'
import AlertsPanel from '../alerts/AlertsPanel'
import { VIEW_BREADCRUMBS } from '../../constants/viewBreadcrumbs'

// Monta a trilha de breadcrumb pra uma view/subView atual, seguindo a
// cadeia de `parent` até a raiz. O último item é sempre a página atual
// (não clicável); os demais navegam de volta pra cada nível.
function buildCrumbs(currentView, subViews) {
  const chain = []
  let view = currentView
  let guard = 0
  while (view && VIEW_BREADCRUMBS[view] && guard++ < 10) {
    chain.unshift({ view, ...VIEW_BREADCRUMBS[view] })
    view = VIEW_BREADCRUMBS[view].parent
  }
  if (chain.length === 0) return []

  const crumbs = chain.map((meta) => ({ view: meta.view, label: meta.label }))
  const last = chain[chain.length - 1]
  const activeSubTab = last.subTabs?.find((t) => t.id === subViews?.[last.view])
  if (activeSubTab) crumbs.push({ label: activeSubTab.label })
  return crumbs
}

// Mini-versão do TYPE_CONFIG de AlertsPanel.jsx, só para os ícones/cores
// da prévia no drawer de notificações.
const TYPE_CONFIG = {
  DIVERGENCIA_CRITICA: { icon: XCircle, color: 'text-destructive-text', label: 'Divergência Crítica' },
  CONFIANCA_BAIXA: { icon: AlertTriangle, color: 'text-warning-text', label: 'Confiança Baixa' },
  VALIDACAO_BLOQUEANTE: { icon: ShieldAlert, color: 'text-destructive-text', label: 'Validação Bloqueante' },
  IMPACTO_FINANCEIRO_ALTO: { icon: DollarSign, color: 'text-info-text', label: 'Impacto Financeiro' },
}

// Header global e minimalista — presente em todas as telas: sino de
// notificações (abre um drawer com a prévia dos alertas) e o avatar do
// usuário à direita.
export default function AppHeader({ currentView, subViews, onNavigate }) {
  const { user, logout } = useAuth()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifDrawer, setShowNotifDrawer] = useState(false)
  const [alertsModalOpen, setAlertsModalOpen] = useState(false)

  const { data: stats } = useQuery({
    queryKey: ['alertStats'],
    queryFn: () => api.getAlertStats(),
    refetchInterval: 60000,
  })

  const { data: preview, isLoading: previewLoading } = useQuery({
    queryKey: ['alertsPreview'],
    queryFn: () => api.getRecentAlerts(5),
    enabled: showNotifDrawer,
  })

  const count = stats?.total || 0
  const initials = user?.name
    ? user.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : '?'
  const crumbs = buildCrumbs(currentView, subViews)

  return (
    <div className="h-14 shrink-0 border-b border-border bg-card flex items-center justify-between px-4 gap-3">
      {crumbs.length > 0 ? (
        <Breadcrumb className="min-w-0">
          {/* DS usa text-sm por padrão — reduzido pra text-xs (mesma escala
              tipográfica do DS, só um degrau menor) porque aqui é metadado
              de navegação, não conteúdo principal do header. */}
          <BreadcrumbList className="flex-nowrap overflow-hidden text-xs">
            {crumbs.map((crumb, idx) => {
              const isLast = idx === crumbs.length - 1
              return (
                <span key={crumb.label} className="flex items-center gap-1.5 min-w-0">
                  {idx > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem className="min-w-0">
                    {isLast || !crumb.view ? (
                      <BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink onClick={() => onNavigate?.(crumb.view)} className="truncate">
                        {crumb.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </span>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      ) : <div />}

      <div className="flex items-center gap-3 shrink-0">
      <Popover open={showNotifDrawer} onOpenChange={setShowNotifDrawer}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Tooltip>
              <TooltipTrigger asChild>
                <IconButton aria-label="Notificações" variant="ghost">
                  <Bell className="w-5 h-5" />
                </IconButton>
              </TooltipTrigger>
              <TooltipContent side="bottom">Notificações</TooltipContent>
            </Tooltip>
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center px-1 pointer-events-none">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-semibold text-sm text-foreground">Notificações</span>
            {count > 0 && <span className="text-xs text-muted-foreground">{count} no total</span>}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {previewLoading ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">Carregando...</div>
            ) : !preview || preview.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                <Bell className="w-6 h-6 mx-auto mb-2 opacity-30" />
                Nenhuma notificação recente
              </div>
            ) : (
              preview.map((alert, idx) => {
                const cfg = TYPE_CONFIG[alert.type] || { icon: Bell, color: 'text-muted-foreground', label: alert.type }
                const Icon = cfg.icon
                return (
                  <div key={idx} className="flex items-start gap-2.5 px-4 py-2.5 border-b border-border last:border-0 hover:bg-muted">
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color}`} />
                    <div className="min-w-0">
                      <p className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</p>
                      <p className="text-xs text-muted-foreground truncate">NF #{alert.invoice_id}{alert.company ? ` · ${alert.company}` : ''}</p>
                      {alert.timestamp && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(alert.timestamp).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="p-2 border-t border-border">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => { setShowNotifDrawer(false); setAlertsModalOpen(true) }}
            >
              Visualizar alertas
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Popover open={showProfileMenu} onOpenChange={setShowProfileMenu}>
        <PopoverTrigger asChild>
          <button
            className="flex items-center rounded-full hover:ring-2 hover:ring-accent transition-shadow shrink-0"
            aria-label="Perfil"
          >
            {user?.picture ? (
              <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 p-0 overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-border bg-muted">
            {user?.picture ? (
              <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                {initials}
              </div>
            )}
            <div>
              <div className="font-semibold text-foreground text-sm leading-tight">{user?.name}</div>
              <div className="text-muted-foreground text-xs mt-0.5">{user?.email}</div>
            </div>
          </div>
          <div className="p-1.5">
            <Button
              variant="ghost"
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
              className="w-full flex items-center justify-start gap-2.5 px-3 py-2 h-auto text-sm text-foreground font-medium hover:bg-muted rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 text-muted-foreground" /> Sair
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={alertsModalOpen} onOpenChange={setAlertsModalOpen}>
        <DialogContent className="p-0 max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogTitle className="sr-only">Alertas</DialogTitle>
          <AlertsPanel />
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
