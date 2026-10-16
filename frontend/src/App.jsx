// TAILWIND-SCAN-TEST bg-fuchsia-950 text-fuchsia-950
import { useCallback, useEffect, useState } from 'react'
import { Toaster, SidebarProvider, SidebarInset } from '@bhubai/bhub-design-system'
import { useAuth } from './auth/useAuth'
import { useHasRole, useHasAnyRole, ROLE_FISCAL_ADM, ROLE_FISCAL_OPERATOR } from './auth/roles'
import { CompanyProvider } from './context/CompanyContext'
import { ToastProvider } from './components/shared/Toast'
import LoginPage from './auth/LoginPage'
import Sidebar from './components/layout/Sidebar'
import AppHeader from './components/layout/AppHeader'
import ListView from './components/invoices/ListView'
import DetailView from './components/invoices/DetailView'
import CrawlerDashboard from './components/legislation/CrawlerDashboard'
import TaxTableAlertsPanel from './components/legislation/TaxTableAlertsPanel'
import SpedManager from './components/sped/SpedManager'
import ChatWidget from './components/chat/ChatWidget'
import ExceptionQueue from './components/exceptions/ExceptionQueue'
import DifalSnFila from './components/difal/DifalSnFila'
import DifalSnRegras from './components/difal/DifalSnRegras'
import ClientOnboarding from './components/onboarding/ClientOnboarding'
import CaptureDashboard from './components/capture/CaptureDashboard'
import CompanyDiagnosis from './components/diagnosis/CompanyDiagnosis'
import ReformDiagnosis from './components/diagnosis/ReformDiagnosis'
import CreditRecovery from './components/recovery/CreditRecovery'
import BatchAnalysis from './components/invoices/BatchAnalysis'
import CfopOperationRules from './components/rules/CfopOperationRules'
import BHubTaxDashboard from './components/bhubtax/BHubTaxDashboard'
import NotasIntegradas from './components/integradas/NotasIntegradas'
import NfseDashboard from './components/nfse/NfseDashboard'
import AuditLog from './components/audit/AuditLog'
import ErrorBoundary from './components/shared/ErrorBoundary'
import { getMesCorrenteRange } from './utils/dateRange'

// Views gated by the `fiscal-adms` Auth0 role. Backend enforces the same role
// on the matching endpoints — this guard is UX defense-in-depth.
const FISCAL_ADM_VIEWS = new Set(['capture', 'onboarding', 'cfop-rules', 'diagnosis', 'recovery'])

// Telas que ficam montadas escondidas (`hidden`) para preservar filtros/scroll
// e por isso precisam de montagem preguiçosa (FE-01). As demais já são
// condicionais em `currentView` — montam e desmontam sozinhas, não entram aqui.
const LAZY_VIEWS = new Set(['bhubtax', 'integradas', 'nfse', 'batch'])

export default function App() {
  const { isLoading, isAuthenticated, logout } = useAuth()
  const isFiscalAdm = useHasRole(ROLE_FISCAL_ADM)
  const hasFiscalAccess = useHasAnyRole(ROLE_FISCAL_ADM, ROLE_FISCAL_OPERATOR)
  const [currentView, setCurrentView] = useState('list')
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [previousView, setPreviousView] = useState('list')
  // Sub-tela ativa por módulo — cada módulo com sub-navegação na sidebar
  // (Notas Fiscais, CT-e, NFC-e, Notas Integradas, Legislação, Dados SPED,
  // BHub Tax) guarda aqui a sua.
  const [subViews, setSubViews] = useState({
    list: 'materiais_recebidas_entradas',
    cte: 'cte_recebidos_entradas',
    nfc: 'nfc_emitidas',
    integradas: 'int_servicos_prestados',
    crawler: 'NFE',
    sped: 'fiscal',
    bhubtax: 'dados',
  })

  // Shared filters — persist across views
  const defaults = getMesCorrenteRange()
  const [sharedStartDate, setSharedStartDate] = useState(defaults.startDate)
  const [sharedEndDate, setSharedEndDate] = useState(defaults.endDate)
  const [sharedCompanyIds, setSharedCompanyIds] = useState([])

  // Montagem preguiçosa das telas pesadas (perf 18/08 — decisão D1 da spec
  // `perf-painel-listagem-notas`). Antes, BHubTax/Integradas/NFS-e/Batch eram
  // montadas junto com a ListView e escondidas via `hidden`: as queries delas
  // rodavam no load e a request da lista entrava na fila HTTP atrás de
  // `/metrics/bhub-tax` (~10 s). Agora cada tela monta na PRIMEIRA visita e
  // permanece montada depois — preserva filtros/scroll ao voltar, que é o
  // comportamento que a operação usa.
  const [visited, setVisited] = useState(() => new Set())
  // Marcado no próprio handler de navegação (mesmo lote de estado do
  // `setCurrentView`), para a tela já sair montada na primeira renderização
  // depois do clique — sem o render intermediário que um efeito produziria.
  const markVisited = useCallback((view) => {
    if (!LAZY_VIEWS.has(view)) return
    setVisited((prev) => (prev.has(view) ? prev : new Set(prev).add(view)))
  }, [])
  // Rede de segurança: qualquer caminho que troque a view sem passar pelo
  // handler (hoje só `handleBackToList`, que volta para uma view já visitada).
  useEffect(() => { markVisited(currentView) }, [currentView, markVisited])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  // Painel BHub Tax restrito ao perfil fiscal (time de validações: admin ou operador).
  // Backend enforce a mesma role nos endpoints; este gate é a barreira de UX.
  if (!hasFiscalAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md text-center bg-card border border-border rounded-lg p-8 shadow-sm">
          <h1 className="text-lg font-semibold text-foreground mb-2">Acesso restrito</h1>
          <p className="text-sm text-muted-foreground mb-6">
            O painel BHub Tax é restrito ao time de validações (perfil fiscal).
            Sua conta não tem essa permissão. Fale com o time de validações se
            precisar de acesso.
          </p>
          <button
            onClick={() => logout?.({ logoutParams: { returnTo: window.location.origin } })}
            className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-accent"
          >
            Sair
          </button>
        </div>
      </div>
    )
  }

  const handleRowClick = (invoice) => {
    setPreviousView(currentView)
    setSelectedInvoice(invoice)
    setCurrentView('detail')
  }

  const handleBackToList = () => {
    setCurrentView(previousView)
    setSelectedInvoice(null)
  }

  const handleNavigate = (view, subView) => {
    // Block navigation to admin-only views for users without the role.
    if (FISCAL_ADM_VIEWS.has(view) && !isFiscalAdm) {
      setCurrentView('list')
      setSelectedInvoice(null)
      return
    }
    if (view === 'list') {
      setSelectedInvoice(null)
    }
    if (subView) {
      setSubViews((prev) => ({ ...prev, [view]: subView }))
    }
    markVisited(view)
    setCurrentView(view)
  }

  return (
    <ToastProvider>
    {/* Toaster do design system (sonner) — usado por componentes migrados de
        useToast() para toast() diretamente (ex: ExceptionQueue). O
        ToastProvider legado continua montado para os demais módulos que
        ainda usam useToast() — ver pendência no relatório de conformidade. */}
    <Toaster />
    <CompanyProvider>
      {/* Casca do app no padrão do DS: SidebarProvider (estado colapsado,
          atalho Ctrl/Cmd+B) + AppSidebar (variant inset) + SidebarInset.
          Começa colapsada, como a sidebar anterior. */}
      <SidebarProvider defaultOpen={false} className="font-sans text-foreground antialiased">
        {/* Left Sidebar */}
        <Sidebar currentView={currentView} subViews={subViews} onNavigate={handleNavigate} />

        {/* Main Content — ErrorBoundary: crash de um painel não pode derrubar
            o console. Vale também para os que seguem montados escondidos
            depois da 1ª visita (BHubTax, Integradas, NFS-e, Batch). */}
        <SidebarInset className="min-w-0 overflow-hidden md:peer-data-[variant=inset]:overflow-hidden">
          <AppHeader
            currentView={currentView}
            subViews={subViews}
            onNavigate={handleNavigate}
            previousView={previousView}
            selectedInvoice={selectedInvoice}
            onOpenInvoice={(invoiceId) => {
              setPreviousView(currentView === 'detail' ? previousView : currentView)
              setSelectedInvoice({ id: invoiceId })
              setCurrentView('detail')
            }}
          />

          <div className="flex-1 min-h-0 flex flex-col">
          <ErrorBoundary resetKey={currentView}>
          {/* ListView stays mounted (hidden) to preserve filters/scroll — uma
              instância por módulo segregado (Notas Fiscais, CTE, NFC), cada
              uma controlando sua própria sub-tela (activeTab) via subViews. */}
          <div className={currentView === 'list' ? 'flex flex-col h-full' : 'hidden'}>
            <ListView onRowClick={handleRowClick} activeTab={subViews.list} onTabChange={(t) => setSubViews((p) => ({ ...p, list: t }))}
              startDate={sharedStartDate} onStartDateChange={setSharedStartDate}
              endDate={sharedEndDate} onEndDateChange={setSharedEndDate}
              companyIds={sharedCompanyIds} onCompanyIdsChange={setSharedCompanyIds} />
          </div>
          <div className={currentView === 'cte' ? 'flex flex-col h-full' : 'hidden'}>
            <ListView onRowClick={handleRowClick} activeTab={subViews.cte} onTabChange={(t) => setSubViews((p) => ({ ...p, cte: t }))}
              startDate={sharedStartDate} onStartDateChange={setSharedStartDate}
              endDate={sharedEndDate} onEndDateChange={setSharedEndDate}
              companyIds={sharedCompanyIds} onCompanyIdsChange={setSharedCompanyIds} />
          </div>
          <div className={currentView === 'nfc' ? 'flex flex-col h-full' : 'hidden'}>
            <ListView onRowClick={handleRowClick} activeTab={subViews.nfc} onTabChange={(t) => setSubViews((p) => ({ ...p, nfc: t }))}
              startDate={sharedStartDate} onStartDateChange={setSharedStartDate}
              endDate={sharedEndDate} onEndDateChange={setSharedEndDate}
              companyIds={sharedCompanyIds} onCompanyIdsChange={setSharedCompanyIds} />
          </div>
          {/* BHub Tax — dashboard fiscal (3 sessões + anomalias). Substitui os
              dashboards antigos (Métricas BHules + Operacional), removidos. */}
          {visited.has('bhubtax') && (
            <div className={currentView === 'bhubtax' ? 'flex flex-col h-full' : 'hidden'}>
              <BHubTaxDashboard activeTab={subViews.bhubtax} onTabChange={(t) => setSubViews((p) => ({ ...p, bhubtax: t }))} />
            </div>
          )}
          {/* Notas Integradas — visibilidade do dual-write (read-only).
              Disponível a todos os usuários autenticados. */}
          {visited.has('integradas') && (
            <div className={currentView === 'integradas' ? 'flex flex-col h-full' : 'hidden'}>
              <NotasIntegradas activeTab={subViews.integradas} onTabChange={(t) => setSubViews((p) => ({ ...p, integradas: t }))} />
            </div>
          )}
          {/* NFS-e — Dashboard + Conferência (worklist direcional de falso-negativo). */}
          {visited.has('nfse') && (
            <div className={currentView === 'nfse' ? 'flex flex-col h-full' : 'hidden'}>
              <NfseDashboard onViewInvoice={(invoiceId) => {
                setPreviousView('nfse')
                setSelectedInvoice({ id: invoiceId })
                setCurrentView('detail')
              }} />
            </div>
          )}
          {visited.has('batch') && (
            <div className={currentView === 'batch' ? 'flex flex-col h-full' : 'hidden'}>
              <BatchAnalysis onViewInvoice={(invoiceId) => {
                setPreviousView('batch')
                setSelectedInvoice({ id: invoiceId })
                setCurrentView('detail')
              }}
                startDate={sharedStartDate} onStartDateChange={setSharedStartDate}
                endDate={sharedEndDate} onEndDateChange={setSharedEndDate}
                companyIds={sharedCompanyIds} onCompanyIdsChange={setSharedCompanyIds} />
            </div>
          )}
          {currentView === 'detail' && (
            <DetailView invoice={selectedInvoice} onBack={handleBackToList} />
          )}
          {currentView === 'crawler' && (
            <CrawlerDashboard activeTab={subViews.crawler} onTabChange={(t) => setSubViews((p) => ({ ...p, crawler: t }))} />
          )}
          {currentView === 'tax-alerts' && (
            <TaxTableAlertsPanel />
          )}
          {currentView === 'sped' && (
            <SpedManager activeTab={subViews.sped} onTabChange={(t) => setSubViews((p) => ({ ...p, sped: t }))} />
          )}
          {currentView === 'exceptions' && (
            <ExceptionQueue />
          )}
          {/* Fila DIFAL-SN (RN-25) — a Célula valida nota a nota; mesmo
              acesso da ExceptionQueue (qualquer usuário autenticado; o POST
              exige JWT no backend). */}
          {currentView === 'difal-fila' && (
            <DifalSnFila />
          )}
          {currentView === 'difal-regras' && (
            <DifalSnRegras />
          )}
          {currentView === 'audit' && (
            <AuditLog />
          )}
          {isFiscalAdm && currentView === 'diagnosis' && (
            <CompanyDiagnosis />
          )}
          {currentView === 'reform-diagnosis' && (
            <ReformDiagnosis />
          )}
          {isFiscalAdm && currentView === 'recovery' && (
            <CreditRecovery />
          )}
          {isFiscalAdm && currentView === 'capture' && (
            <CaptureDashboard />
          )}
          {isFiscalAdm && currentView === 'onboarding' && (
            <ClientOnboarding />
          )}
          {isFiscalAdm && currentView === 'cfop-rules' && (
            <CfopOperationRules />
          )}
          </ErrorBoundary>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </CompanyProvider>
    </ToastProvider>
  )
}
