import { useState, useEffect, useRef } from 'react'
import {
  X, Play, CheckCircle2, AlertTriangle, Brain, Scale, FileSearch, Calculator,
  Shield, BookOpen, Cpu, Zap, ClipboardCheck, Loader2, ChevronRight, DollarSign,
} from 'lucide-react'
import { Sheet, SheetContent, Button, Input, Label } from '@bhubai/bhub-design-system'

// ── Engine steps simulation ──────────────────────────────────────────
const ENGINE_STEPS = [
  { id: 0, label: 'Pre-condições', detail: 'Validando formato XML, dados obrigatórios e histórico SPED...', icon: FileSearch },
  { id: 1, label: 'Contexto', detail: 'Analisando regras CTX/EMP/FORN, bloqueios e cenários especiais...', icon: Shield },
  { id: 2, label: 'Finalidade', detail: 'Classificando finalidade: revenda, matéria-prima, ativo, uso/consumo...', icon: Brain },
  { id: 3, label: 'NCM / CFOP', detail: 'Classificando produtos, validando CST/CSOSN e regras CFOP...', icon: BookOpen },
  { id: 4, label: 'ICMS & DIFAL', detail: 'Calculando alíquotas ICMS, DIFAL, FCP e créditos...', icon: Calculator },
  { id: 5, label: 'ST & Benefícios', detail: 'Verificando substituição tributária, exceções e benefícios fiscais...', icon: Scale },
  { id: 6, label: 'PIS / COFINS', detail: 'Detectando monofásicos, calculando créditos PIS/COFINS...', icon: Cpu },
  { id: 7, label: 'Conferência', detail: 'Validando BC declarada vs calculada, totais e cálculos...', icon: ClipboardCheck },
  { id: 8, label: 'Decisão & IA', detail: 'Cruzando dados, detectando anomalias e gerando decisões...', icon: Zap },
]

// ── Phase: CONFIRM ───────────────────────────────────────────────────
function ConfirmPhase({ companies, startDate, endDate, confirmText, onConfirmTextChange, onConfirm, onClose, disabled }) {
  return (
    <>
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Reprocessar Motor de Regras</h3>
        <p className="text-sm text-muted-foreground mt-1">{companies}</p>
      </div>
      <div className="px-6 py-5 space-y-4">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">Periodo:</span>
          <span className="font-medium text-foreground">{startDate || 'inicio'} a {endDate || 'hoje'}</span>
        </div>
        <div className="bg-warning-subtle border border-warning-border rounded-lg p-3 text-sm text-warning-text">
          Esta acao ira reprocessar todas as notas do periodo. Os resultados anteriores serao sobrescritos.
        </div>
        <div>
          <Label htmlFor="reprocess-confirm-text" className="block mb-2">
            Digite <strong>REPROCESSAR</strong> para confirmar
          </Label>
          <Input
            id="reprocess-confirm-text"
            type="text"
            value={confirmText}
            onChange={(e) => onConfirmTextChange(e.target.value)}
            placeholder="REPROCESSAR"
            autoFocus
          />
        </div>
      </div>
      <div className="px-6 py-4 border-t border-border bg-muted flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={onConfirm} disabled={disabled}>
          <Play className="w-4 h-4" /> Confirmar Reprocessamento
        </Button>
      </div>
    </>
  )
}

// ── Phase: PROCESSING ────────────────────────────────────────────────
function ProcessingPhase({ progress, simulatedStep, invoicePhrase }) {
  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0
  const allStepsDone = simulatedStep >= ENGINE_STEPS.length - 1
  const currentStep = ENGINE_STEPS[Math.min(simulatedStep, ENGINE_STEPS.length - 1)]
  const StepIcon = currentStep.icon

  return (
    <>
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-border" />
          <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="17" fill="none" stroke="var(--primary)" strokeWidth="3"
              strokeDasharray={`${pct * 1.07} 107`} strokeLinecap="round"
              className="transition-all duration-500" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-primary">{pct}%</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Motor de Regras</h3>
          <p className="text-xs text-muted-foreground">
            {progress.current}/{progress.total} notas processadas
          </p>
        </div>
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* Current step highlight */}
        {!allStepsDone ? (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
            <div className="mt-0.5 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <StepIcon className="w-4 h-4 text-primary animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Etapa {currentStep.id + 1}: {currentStep.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{currentStep.detail}</p>
            </div>
          </div>
        ) : (
          <div className="bg-success-subtle border border-success-border rounded-lg p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-success-subtle flex items-center justify-center flex-shrink-0">
              <Loader2 className="w-4 h-4 text-success-text animate-spin" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Processando notas fiscais...</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {progress.current} de {progress.total} concluidas — aguardando finalizacao
              </p>
            </div>
          </div>
        )}

        {/* Steps timeline */}
        <div className="grid grid-cols-3 gap-2">
          {ENGINE_STEPS.map((step, i) => {
            const done = i < simulatedStep
            const active = i === simulatedStep
            const Icon = step.icon
            return (
              <div key={step.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-300 ${
                done ? 'bg-success-subtle' : active ? 'bg-primary/5 ring-1 ring-primary/20' : 'bg-muted/50'
              }`}>
                <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                  done ? 'bg-success-subtle' : active ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  {done ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-success-text" />
                  ) : active ? (
                    <Icon className="w-3.5 h-3.5 text-primary animate-pulse" />
                  ) : (
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </div>
                <span className={`text-xs leading-tight truncate ${
                  done ? 'text-success-text font-medium' : active ? 'text-primary font-semibold' : 'text-muted-foreground'
                }`}>{step.label}</span>
              </div>
            )
          })}
        </div>

        {/* Progress bar */}
        <div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Live activity feed */}
        <div className="bg-neutral-900 rounded-lg p-3 font-mono text-xs text-green-400 h-20 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-neutral-900 z-10 pointer-events-none" />
          <p className="opacity-30">$ bhules-engine --analyze --period</p>
          <p className="opacity-50">[etapa {Math.max(simulatedStep, 1)}] {ENGINE_STEPS[Math.max(simulatedStep - 1, 0)]?.label}... ok</p>
          <p className="animate-pulse">[etapa {simulatedStep + 1}] {invoicePhrase}</p>
        </div>
      </div>
    </>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────
function fmtBRL(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtNum(v) {
  return v.toLocaleString('pt-BR')
}

// ── Phase: RESULTS ───────────────────────────────────────────────────
function ResultsPhase({ progress, elapsed, onClose }) {
  const total = progress.total || 0
  const errors = progress.errors || 0
  const processed = progress.current || 0

  // Extract real data from results_summary (aggregated from all jobs)
  const summary = {}
  const jobs = progress.jobs || []
  for (const j of jobs) {
    const rs = j.results_summary || {}
    for (const [k, v] of Object.entries(rs)) {
      summary[k] = (summary[k] || 0) + (typeof v === 'number' ? v : 0)
    }
  }

  // 3 statuses: CONFORME, REQUER_REVISAO, BLOQUEADO
  const conforme = summary['CONFORME'] || 0
  const revisao = summary['REQUER_REVISAO'] || 0
  const bloqueado = summary['BLOQUEADO'] || 0
  const automaticas = conforme
  const totalItems = summary['_total_items'] || 0
  const totalValor = summary['_total_valor'] || 0

  const totalAnalised = processed - errors
  const confianca = totalAnalised > 0 ? Math.round((automaticas / totalAnalised) * 100) : 0

  return (
    <>
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-success-subtle flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-success-text" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Analise Concluida</h3>
            <p className="text-xs text-muted-foreground">Analise concluida em {elapsed}s</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* Key metrics row */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-primary/5 rounded-lg p-3 text-center">
            <p className="text-2xl font-semibold text-primary">{confianca}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">Confianca</p>
          </div>
          <div className="bg-success-subtle rounded-lg p-3 text-center">
            <p className="text-2xl font-semibold text-success-text">{fmtNum(automaticas)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Conforme</p>
          </div>
          <div className="bg-warning-subtle rounded-lg p-3 text-center">
            <p className="text-2xl font-semibold text-warning-text">{fmtNum(revisao)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Revisao</p>
          </div>
          <div className="bg-destructive-subtle rounded-lg p-3 text-center">
            <p className="text-2xl font-semibold text-destructive-text">{fmtNum(bloqueado)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Bloqueado</p>
          </div>
        </div>

        {/* Volume info */}
        {totalValor > 0 && (
          <div className="bg-muted rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Volume analisado</span>
            <span className="text-sm font-semibold text-foreground">{fmtBRL(totalValor)}</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total de notas</span>
            <span className="text-sm font-semibold text-foreground">{fmtNum(total)}</span>
          </div>
          <div className="bg-muted rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Produtos analisados</span>
            <span className="text-sm font-semibold text-foreground">{fmtNum(totalItems)}</span>
          </div>
        </div>

        {errors > 0 && (
          <div className="bg-destructive-subtle rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <X className="w-4 h-4 text-destructive-text" />
              <span className="text-sm text-foreground">Erros no processamento</span>
            </div>
            <span className="text-lg font-semibold text-destructive-text">{errors}</span>
          </div>
        )}

        {/* Summary box */}
        <div className="bg-muted rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" /> Resumo
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1.5">
            <li className="flex items-start gap-2">
              <ChevronRight className="w-3 h-3 mt-0.5 text-success-text flex-shrink-0" />
              <span><strong>{fmtNum(automaticas)}</strong> notas conformes — escrituradas automaticamente com CFOP, ICMS, PIS/COFINS e CST classificados com base na legislacao vigente.</span>
            </li>
            {revisao > 0 && (
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3 h-3 mt-0.5 text-warning-text flex-shrink-0" />
                <span><strong>{fmtNum(revisao)}</strong> notas requerem revisao — divergencia em base de calculo, beneficio fiscal ou cenario atipico detectado pelo motor.</span>
              </li>
            )}
            {bloqueado > 0 && (
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3 h-3 mt-0.5 text-destructive-text flex-shrink-0" />
                <span><strong>{fmtNum(bloqueado)}</strong> notas bloqueadas — problemas na validacao formal que impedem a escrituracao automatica.</span>
              </li>
            )}
            {errors > 0 && (
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3 h-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                <span><strong>{errors}</strong> erros de processamento — serao reprocessadas na proxima execucao.</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-border bg-muted flex justify-end">
        <Button size="lg" onClick={onClose}>
          Ver Resultados
        </Button>
      </div>
    </>
  )
}

// ── Terminal phrases for the live feed ───────────────────────────────
const INVOICE_PHRASES = [
  'Classificando CFOP 1102 -> revenda dentro do estado...',
  'Consultando aliquota ICMS interestadual SP->RJ...',
  'Detectando monofasico NCM 3304.99.10 (PIS/COFINS)...',
  'Validando CST 060 — ST recolhido anteriormente...',
  'Calculando DIFAL + FCP para ativo imobilizado...',
  'Verificando credito ICMS/ST conf. CEST 13.001.00...',
  'Cruzando BC declarada vs calculada (tolerancia 0.5%)...',
  'Consultando legislacao CONFAZ — Convenio 142/2018...',
  'Aplicando regra CFOP 2556 — compra de energia...',
  'Validando CIAP — credito ICMS 1/48 ativo imobilizado...',
  'Classificando IPI — NCM cap. 84 (maquinas)...',
  'Verificando cBenef ES990001 — isencao ICMS...',
  'Detectando oportunidade: PIS/COFINS nao-cumulativo...',
  'Consultando tabela TIPI/NCM atualizada...',
  'Analisando regime emitente via SERPRO...',
  'Verificando beneficio fiscal cBenef UF destino...',
  'Cross-check: XML vs SPED EFD contribuicoes...',
  'IA analisando padrao de anomalia em BC ICMS...',
]

// ── Main Component ───────────────────────────────────────────────────
export default function ReprocessingModal({
  isOpen,
  onClose,
  onConfirm,
  progress,       // { current, total, errors, jobs } | null
  companies,      // string description
  startDate,
  endDate,
}) {
  const [confirmText, setConfirmText] = useState('')
  const [simulatedStep, setSimulatedStep] = useState(0)
  const [invoicePhrase, setInvoicePhrase] = useState(INVOICE_PHRASES[0])
  const [phase, setPhase] = useState('confirm') // confirm | processing | results
  const [elapsed, setElapsed] = useState(0)
  const startTimeRef = useRef(null)
  const phraseIndexRef = useRef(0)

  // Phase transitions — once in 'results', never go back to 'processing'
  useEffect(() => {
    if (!progress) {
      setPhase((prev) => {
        if (prev === 'results') return prev // stay on results until explicit close
        setSimulatedStep(0)
        setElapsed(0)
        startTimeRef.current = null
        return 'confirm'
      })
      return
    }

    setPhase((prev) => {
      if (prev === 'results') return prev // lock — don't regress

      const isComplete = progress.current > 0 && progress.current >= progress.total
      if (isComplete) {
        setSimulatedStep(ENGINE_STEPS.length)
        if (startTimeRef.current) {
          setElapsed(Math.round((Date.now() - startTimeRef.current) / 1000))
        }
        return 'results'
      }

      if (!startTimeRef.current) startTimeRef.current = Date.now()
      return 'processing'
    })
  }, [progress])

  // Advance steps linearly once — 800ms each, then hold on last step
  useEffect(() => {
    if (phase !== 'processing') return

    setSimulatedStep(0)
    const stepMs = 800
    const interval = setInterval(() => {
      setSimulatedStep((prev) => {
        if (prev >= ENGINE_STEPS.length - 1) {
          clearInterval(interval)
          return prev
        }
        return prev + 1
      })
    }, stepMs)

    return () => clearInterval(interval)
  }, [phase])

  // Rotate terminal phrases quickly
  useEffect(() => {
    if (phase !== 'processing') return

    const interval = setInterval(() => {
      phraseIndexRef.current = (phraseIndexRef.current + 1) % INVOICE_PHRASES.length
      setInvoicePhrase(INVOICE_PHRASES[phraseIndexRef.current])
    }, 1200)

    return () => clearInterval(interval)
  }, [phase])

  // Reset confirm text when closing
  useEffect(() => {
    if (!isOpen) {
      setConfirmText('')
      setPhase('confirm')
    }
  }, [isOpen])

  const handleConfirm = () => {
    setPhase('processing')
    onConfirm()
  }

  const handleClose = () => {
    setConfirmText('')
    onClose()
  }

  const canClose = phase === 'confirm' || phase === 'results'

  return (
    <Sheet open={!!isOpen} onOpenChange={(open) => { if (!open && canClose) handleClose() }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 gap-0 overflow-y-auto"
        showCloseButton={canClose}
        onPointerDownOutside={(e) => { if (!canClose) e.preventDefault() }}
        onEscapeKeyDown={(e) => { if (!canClose) e.preventDefault() }}
      >
        {phase === 'confirm' && (
          <ConfirmPhase
            companies={companies}
            startDate={startDate}
            endDate={endDate}
            confirmText={confirmText}
            onConfirmTextChange={setConfirmText}
            onConfirm={handleConfirm}
            onClose={handleClose}
            disabled={confirmText !== 'REPROCESSAR'}
          />
        )}

        {phase === 'processing' && progress && (
          <ProcessingPhase
            progress={progress}
            simulatedStep={simulatedStep}
            invoicePhrase={invoicePhrase}
          />
        )}

        {phase === 'results' && progress && (
          <ResultsPhase
            progress={progress}
            elapsed={elapsed}
            onClose={handleClose}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
