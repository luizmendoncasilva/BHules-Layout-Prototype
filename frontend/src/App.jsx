// TAILWIND-SCAN-TEST bg-fuchsia-950 text-fuchsia-950
import { useState } from 'react'
import { Toaster } from '@bhubai/bhub-design-system'
import { useAuth } from './auth/useAuth'
import { useHasRole, ROLE_FISCAL_ADM } from './auth/roles'
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
import ClientOnboarding from './components/onboarding/ClientOnboarding'
import CaptureDashboard from './components/capture/CaptureDashboard'
import CompanyDiagnosis from './components/diagnosis/CompanyDiagnosis'
import ReformDiagnosis from './components/diagnosis/ReformDiagnosis'
import CreditRecovery from './components/recovery/CreditRecovery'
import BatchAnalysis from './components/invoices/BatchAnalysis'
import CfopOperationRules from './components/rules/CfopOperationRules'
import BHubTaxDashboard from './components/bhubtax/BHubTaxDashboard'
import NotasIntegradas from './components/integradas/NotasIntegradas'
import AuditLog from './components/audit/AuditLog'


function getDefaultDateRange() {
  const now = new Date()
  const end = now.toISOString().slice(0, 10)
  const start = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().slice(0, 10)
  return { startDate: start, endDate: end }
}

// Views gated by the `fiscal-adms` Auth0 role. Backend enforces the same role
// on the matching endpoints — this guard is UX defense-in-depth.
const FISCAL_ADM_VIEWS = new Set(['capture', 'onboarding', 'cfop-rules', 'diagnosis', 'recovery'])

export default function App() {
  const { isLoading, isAuthenticated, logout } = useAuth()
  const isFiscalAdm = useHasRole(ROLE_FISCAL_ADM)
  const [currentView, setCurrentView] = useState('list')
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [previousView, setPreviousView] = useState('list')
  const [listActiveTab, setListActiveTab] = useState('Materiais')
  // Sub-tela ativa por módulo — cada módulo com sub-navegação na sidebar
  // (Notas Integradas, Legislação, Dados SPED, BHub Tax) guarda aqui a sua.
  const [subViews, setSubViews] = useState({
    integradas: 'nfse_saida',
    crawler: 'NFE',
    sped: 'fiscal',
    bhubtax: 'dados',
  })

  // Shared filters — persist across views
  const defaults = getDefaultDateRange()
  const [sharedStartDate, setSharedStartDate] = useState(defaults.startDate)
  const [sharedEndDate, setSharedEndDate] = useState(defaults.endDate)
  const [sharedCompanyIds, setSharedCompanyIds] = useState([])

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

  // Painel BHub Tax restrito ao perfil fiscal (time de validações). Backend
  // enforce a mesma role nos endpoints; este gate é a barreira de UX.
  if (!isFiscalAdm) {
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
      <div className="flex h-screen w-full bg-background font-sans text-foreground antialiased overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar currentView={currentView} subViews={subViews} onNavigate={handleNavigate} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          <AppHeader currentView={currentView} subViews={subViews} onNavigate={handleNavigate} />

          <div className="flex-1 min-h-0 flex flex-col">
          {/* ListView stays mounted (hidden) to preserve filters/scroll */}
          <div className={currentView === 'list' ? 'flex flex-col h-full' : 'hidden'}>
            <ListView onRowClick={handleRowClick} activeTab={listActiveTab} onTabChange={setListActiveTab}
              startDate={sharedStartDate} onStartDateChange={setSharedStartDate}
              endDate={sharedEndDate} onEndDateChange={setSharedEndDate}
              companyIds={sharedCompanyIds} onCompanyIdsChange={setSharedCompanyIds} />
          </div>
          {/* BHub Tax — dashboard fiscal (3 sessões + anomalias). Substitui os
              dashboards antigos (Métricas BHules + Operacional), removidos. */}
          <div className={currentView === 'bhubtax' ? 'flex flex-col h-full' : 'hidden'}>
            <BHubTaxDashboard activeTab={subViews.bhubtax} onTabChange={(t) => setSubViews((p) => ({ ...p, bhubtax: t }))} />
          </div>
          {/* Notas Integradas — visibilidade do dual-write (read-only).
              Disponível a todos os usuários autenticados. */}
          <div className={currentView === 'integradas' ? 'flex flex-col h-full' : 'hidden'}>
            <NotasIntegradas activeTab={subViews.integradas} onTabChange={(t) => setSubViews((p) => ({ ...p, integradas: t }))} />
          </div>
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
          </div>
        </div>
      </div>
    </CompanyProvider>
    </ToastProvider>
  )
}
