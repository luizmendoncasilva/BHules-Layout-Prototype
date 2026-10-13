import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Building2,
  Calendar,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Search,
  Filter,
  Layers,
  Info,
} from 'lucide-react'
import {
  getTributacaoServicos,
  salvarParametrizacaoServico,
  getTrackingOrigens,
  getExportacaoEmpresa,
  salvarCadastroExportador,
  substituirCadastroExportador,
  revogarCadastroExportador,
  criarTomadorExportacao,
  revogarTomadorExportacao,
  marcarAlertaVinculoCiente,
  getRevisoesExportacao,
  decidirRevisaoExportacao,
  getConferencia,
  concluirConferencia,
  reabrirConferencia,
} from '../../services/tributacaoService'
import { Button, Card, Input, Spinner } from '@bhubai/bhub-design-system'
import { EmpresaResumoCard } from './EmpresaResumoCard'
import { ConferenciaCard } from './ConferenciaCard'
import { KpiMetricsCards } from './KpiMetricsCards'
import { TrackingOrigensCards } from './TrackingOrigensCards'
import { TabelaCodigosServico } from './TabelaCodigosServico'
import { TabelaHistoricoAlteracoes } from './TabelaHistoricoAlteracoes'
import { SeletorEmpresaCombobox } from './SeletorEmpresaCombobox'
import {
  ExportadorCadastroCard,
  AlertaVinculoCard,
  RevisoesExportacaoEmpresa,
} from '../exportacao'

/**
 * Competência anterior à data local (spec TRK-16): em 24/09/2026 → '2026-08';
 * em janeiro → dezembro do ano anterior. É a competência em apuração.
 */
export function mesAnterior(hoje = new Date()) {
  const d = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function fromMonthValue(monthStr) {
  return (monthStr || mesAnterior()).replace('-', '')
}

function formatCompetenciaDisplay(compStr) {
  if (!compStr) return ''
  const clean = String(compStr).replace(/[-/]/g, '')
  if (clean.length >= 6) {
    return `${clean.slice(4, 6)}/${clean.slice(0, 4)}`
  }
  return compStr
}

export default function TributacaoServicosTab({
  companies = [],
  initialCompanyId = null,
  onCompanyChange = null,
  onOpenInvoice = null,
}) {
  // Competência padrão: sempre a anterior à data atual, independente do filtro
  // de datas compartilhado da listagem (spec TRK-16).
  const [selectedMonth, setSelectedMonth] = useState(() => mesAnterior())
  const competencia = useMemo(() => fromMonthValue(selectedMonth), [selectedMonth])

  // Lista de empresas ordenadas alfabeticamente
  const sortedCompanies = useMemo(() => {
    return [...companies].sort((a, b) =>
      (a.razao_social || '').localeCompare(b.razao_social || '', 'pt-BR')
    )
  }, [companies])

  // Empresa selecionada: prioriza initialCompanyId, ou a primeira do Simples Nacional, ou a primeira da lista
  const [selectedCompanyId, setSelectedCompanyId] = useState(() => {
    if (initialCompanyId) return initialCompanyId
    const firstSimples = companies.find((c) => c.regime_tributario === 'SIMPLES')
    if (firstSimples) return firstSimples.id
    if (companies.length > 0) return companies[0].id
    return null
  })

  const handleSelectCompany = (id) => {
    setSelectedCompanyId(id)
    onCompanyChange?.(id)
  }

  // Sincroniza se initialCompanyId mudar externamente
  useEffect(() => {
    if (initialCompanyId && initialCompanyId !== selectedCompanyId) {
      setSelectedCompanyId(initialCompanyId)
    }
  }, [initialCompanyId])

  // Estado dos dados fiscais da empresa
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successToast, setSuccessToast] = useState(null)

  // Estado dos dados de tracking de origens
  const [trackingData, setTrackingData] = useState(null)
  const [trackingLoading, setTrackingLoading] = useState(false)

  // Estado dos dados de exportação e revisões da empresa
  const [exportacaoData, setExportacaoData] = useState(null)
  const [revisoesEmpresa, setRevisoesEmpresa] = useState([])
  const [exportacaoLoading, setExportacaoLoading] = useState(false)

  // Carregar dados de tributação
  const fetchData = useCallback(async () => {
    if (!selectedCompanyId) {
      setData(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await getTributacaoServicos(selectedCompanyId, competencia)
      setData(res)
    } catch (err) {
      console.error('Erro ao buscar tributação de serviços:', err)
      setError(err.message || 'Falha ao carregar dados de tributação.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [selectedCompanyId, competencia])

  // Carregar dados de tracking de origens (represamento e integradores)
  // refresh=true (botões de recarregar) ignora o cache de 5 min da IntegradorNF.
  const fetchTracking = useCallback(async (refresh = false) => {
    if (!selectedCompanyId) {
      setTrackingData(null)
      return
    }
    setTrackingLoading(true)
    try {
      const res = await getTrackingOrigens(selectedCompanyId, competencia, { refresh })
      setTrackingData(res)
    } catch (err) {
      console.error('Erro ao consultar tracking de origens:', err)
      setTrackingData(null)
    } finally {
      setTrackingLoading(false)
    }
  }, [selectedCompanyId, competencia])

  // Carregar dados de exportação e revisões da empresa
  const fetchExportacao = useCallback(async () => {
    if (!selectedCompanyId) {
      setExportacaoData(null)
      setRevisoesEmpresa([])
      return
    }
    setExportacaoLoading(true)
    try {
      const [expRes, revRes] = await Promise.all([
        getExportacaoEmpresa(selectedCompanyId).catch((err) => {
          console.warn('Erro ao carregar dados de exportação:', err)
          return null
        }),
        getRevisoesExportacao({ company_id: selectedCompanyId, competencia }).catch((err) => {
          console.warn('Erro ao carregar revisões da empresa:', err)
          return []
        }),
      ])
      setExportacaoData(expRes)
      setRevisoesEmpresa(Array.isArray(revRes) ? revRes : [])
    } finally {
      setExportacaoLoading(false)
    }
  }, [selectedCompanyId, competencia])

  useEffect(() => {
    fetchData()
    fetchTracking()
    fetchExportacao()
  }, [fetchData, fetchTracking, fetchExportacao])

  // Salvar parametrização
  const handleSalvarParametrizacao = async (payload) => {
    if (!selectedCompanyId) return
    setError(null)
    try {
      await salvarParametrizacaoServico(selectedCompanyId, payload)
      setSuccessToast(`Parametrização do código ${payload.subitem_lc116} salva com sucesso!`)
      setTimeout(() => setSuccessToast(null), 4000)
      // Recarrega os dados para atualizar a tabela e o histórico
      await fetchData()
    } catch (err) {
      console.error('Erro ao salvar parametrização:', err)
      throw err
    }
  }

  // Handlers do Cadastro de Exportadores e Tomadores
  const handleSalvarCadastro = async (payload) => {
    if (!selectedCompanyId) return
    await salvarCadastroExportador(selectedCompanyId, payload)
    await fetchExportacao()
  }

  const handleSubstituirCadastro = async (cadastroId, payload) => {
    if (!selectedCompanyId) return
    await substituirCadastroExportador(selectedCompanyId, cadastroId, payload)
    await fetchExportacao()
  }

  const handleRevogarCadastro = async (cadastroId, dataRevogacao) => {
    if (!selectedCompanyId) return
    await revogarCadastroExportador(selectedCompanyId, cadastroId, dataRevogacao)
    await fetchExportacao()
  }

  const handleCriarTomador = async (payload) => {
    if (!selectedCompanyId) return
    await criarTomadorExportacao(selectedCompanyId, payload)
    await fetchExportacao()
  }

  const handleRevogarTomador = async (tomadorId, dataRevogacao) => {
    if (!selectedCompanyId) return
    await revogarTomadorExportacao(selectedCompanyId, tomadorId, dataRevogacao)
    await fetchExportacao()
  }

  const handleMarcarAlertaCiente = async (alertaId) => {
    if (!selectedCompanyId) return
    await marcarAlertaVinculoCiente(selectedCompanyId, alertaId)
    await fetchExportacao()
  }

  const handleDecidirRevisao = async (revisaoId, payload) => {
    const resultado = await decidirRevisaoExportacao(revisaoId, payload)
    await fetchExportacao()
    return resultado
  }

  // Empresa atualmente selecionada no array
  const currentCompany = useMemo(() => {
    return companies.find((c) => String(c.id) === String(selectedCompanyId)) || null
  }, [companies, selectedCompanyId])

  // Conferência concluída da empresa × competência (Célula 24/09, item 4.1 / FIS-1090)
  const [conferencia, setConferencia] = useState(null)
  const [conferenciaLoading, setConferenciaLoading] = useState(false)
  const [conferenciaSaving, setConferenciaSaving] = useState(false)
  const cnpjSelecionado = currentCompany?.cnpj || null

  const fetchConferencia = useCallback(async () => {
    if (!cnpjSelecionado) {
      setConferencia(null)
      return
    }
    setConferenciaLoading(true)
    try {
      const res = await getConferencia(cnpjSelecionado, competencia)
      setConferencia(res)
    } catch (err) {
      console.error('Erro ao consultar conferência da competência:', err)
      setConferencia(null)
    } finally {
      setConferenciaLoading(false)
    }
  }, [cnpjSelecionado, competencia])

  useEffect(() => {
    fetchConferencia()
  }, [fetchConferencia])

  const handleConcluirConferencia = async (observacao) => {
    if (!cnpjSelecionado) return
    setError(null)
    setConferenciaSaving(true)
    try {
      const res = await concluirConferencia(cnpjSelecionado, competencia, observacao)
      setConferencia(res)
      setSuccessToast(`Conferência de ${formatCompetenciaDisplay(competencia)} concluída. A empresa está apta ao DAS.`)
      setTimeout(() => setSuccessToast(null), 4000)
    } catch (err) {
      console.error('Erro ao concluir conferência:', err)
      setError(err.message || 'Falha ao concluir a conferência.')
    } finally {
      setConferenciaSaving(false)
    }
  }

  const handleReabrirConferencia = async (motivo) => {
    if (!cnpjSelecionado) return
    setError(null)
    setConferenciaSaving(true)
    try {
      const res = await reabrirConferencia(cnpjSelecionado, competencia, motivo)
      setConferencia(res)
      setSuccessToast(`Conferência de ${formatCompetenciaDisplay(competencia)} reaberta.`)
      setTimeout(() => setSuccessToast(null), 4000)
    } catch (err) {
      console.error('Erro ao reabrir conferência:', err)
      setError(err.message || 'Falha ao reabrir a conferência.')
    } finally {
      setConferenciaSaving(false)
    }
  }

  const historicoCompleto = useMemo(() => {
    const ciclos = conferencia?.historico || []
    const linhas = []
    for (const c of ciclos) {
      linhas.push({
        id: `conf-${c.id}-c`,
        quando: c.concluidaEm,
        quem: c.concluidaPor,
        subitem_lc116: 'EMPRESA',
        campo: 'conferência',
        valor_anterior: null,
        valor_novo: 'Concluída',
        vigencia_inicio: c.periodoApuracao,
        motivo: c.observacao || 'Conferência de faturamento e classificação concluída',
      })
      if (c.reabertaEm) {
        linhas.push({
          id: `conf-${c.id}-r`,
          quando: c.reabertaEm,
          quem: c.reabertaPor,
          subitem_lc116: 'EMPRESA',
          campo: 'conferência',
          valor_anterior: 'Concluída',
          valor_novo: 'Reaberta',
          vigencia_inicio: c.periodoApuracao,
          motivo: c.motivoReabertura || 'Conferência reaberta',
        })
      }
    }
    return [...linhas, ...(data?.historico || [])].sort(
      (a, b) => new Date(b.quando) - new Date(a.quando)
    )
  }, [conferencia, data])

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header / Toolbar da Aba */}
      <Card padding="none" className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <Layers className="w-4 h-4 text-primary" />
            <span>Tributação por Código de Serviço</span>
          </div>
          <span className="text-muted-foreground/60">|</span>

          {/* Seletor de Empresa (Combobox Pesquisável) */}
          <div className="flex items-center gap-2">
            <SeletorEmpresaCombobox
              companies={sortedCompanies}
              selectedCompanyId={selectedCompanyId}
              onSelectCompany={handleSelectCompany}
              disabled={loading || trackingLoading}
            />
          </div>

          {/* Seletor de Competência */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Competência:</span>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value || mesAnterior())}
              className="w-auto h-auto px-2.5 py-1 text-sm bg-card font-medium text-foreground"
            />
          </div>
        </div>

        {/* Botão de Atualizar */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchData()
              fetchTracking(true)
              fetchExportacao()
              fetchConferencia()
            }}
            disabled={loading || trackingLoading || exportacaoLoading}
            className="gap-1.5 bg-card"
            title="Recarregar dados da competência"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading || trackingLoading || exportacaoLoading ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
            <span>Atualizar</span>
          </Button>
        </div>
      </Card>

      {/* Toast de Sucesso */}
      {successToast && (
        <div className="bg-success-subtle border border-success-border text-success-text px-4 py-3 rounded-lg flex items-center gap-2 shadow-xs transition-all">
          <CheckCircle2 className="w-4 h-4 text-success-text shrink-0" />
          <span className="text-sm font-medium">{successToast}</span>
        </div>
      )}

      {/* Mensagem de Erro */}
      {error && (
        <div className="bg-destructive-subtle border border-destructive-border text-destructive-text px-4 py-3 rounded-lg flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive-text shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              fetchData()
              fetchTracking(true)
              fetchExportacao()
              fetchConferencia()
            }}
            className="font-semibold text-destructive-text hover:text-destructive-text underline"
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Conferência concluída → libera a empresa para o DAS no motor SN (item 4.1).
          Fica fora de `data &&` para que, sem empresa selecionada, o botão apareça
          desabilitado com a explicação. */}
      <ConferenciaCard
        estado={conferencia}
        loading={conferenciaLoading}
        saving={conferenciaSaving}
        competenciaLabel={formatCompetenciaDisplay(competencia)}
        disabledReason={
          !cnpjSelecionado
            ? 'Selecione uma empresa e uma competência para concluir a conferência.'
            : null
        }
        onConcluir={handleConcluirConferencia}
        onReabrir={handleReabrirConferencia}
      />

      {/* Loading Skeleton */}
      {loading && !data && (
        <Card padding="none" className="flex flex-col items-center justify-center py-20 gap-0">
          <Spinner size="xl" className="text-primary mb-3" />
          <p className="text-sm text-muted-foreground font-medium">Carregando apuração da competência {formatCompetenciaDisplay(competencia)}...</p>
        </Card>
      )}

      {/* Conteúdo Carregado */}
      {!loading && !data && !error && (
        <Card padding="none" className="text-center py-16 gap-0">
          <Building2 className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground">Selecione uma empresa</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
            Escolha uma empresa habilitada no Simples Nacional e a competência desejada para visualizar o relatório de tributação.
          </p>
        </Card>
      )}

      {data && (
        <>
          {/* Card Resumo da Empresa e Fator R */}
          <EmpresaResumoCard
            empresa={data.empresa}
            fatorR={data.fator_r}
          />

          {/* Cards de Métricas e KPIs Consolidados */}
          <KpiMetricsCards
            kpis={data.kpis}
            periodoTexto={`competência ${formatCompetenciaDisplay(competencia)}`}
          />

          {/* Cards de Tracking de Represamento por Origem */}
          <TrackingOrigensCards
            trackingData={trackingData}
            loading={trackingLoading}
            onRefresh={() => fetchTracking(true)}
            companyId={selectedCompanyId}
            competencia={competencia}
            onOpenInvoice={onOpenInvoice}
          />

          {/* Alertas de Vínculo Societário (vincPrest 1–5) */}
          <AlertaVinculoCard
            alertas={exportacaoData?.alertas_vinculo}
            companyId={selectedCompanyId}
            onMarcarCiente={handleMarcarAlertaCiente}
            loading={exportacaoLoading}
          />

          {/* Revisões Abertas de Exportação da Empresa */}
          <RevisoesExportacaoEmpresa
            revisoes={revisoesEmpresa}
            empresaNome={currentCompany?.razao_social}
            onDecidir={handleDecidirRevisao}
            loading={exportacaoLoading}
          />

          {/* Cadastro de Exportadores de Serviços e Tomadores Conhecidos */}
          <ExportadorCadastroCard
            empresa={exportacaoData?.empresa || currentCompany}
            cadastroVivo={exportacaoData?.cadastro_vivo}
            historico={exportacaoData?.historico}
            tomadores={exportacaoData?.tomadores}
            onSalvarCadastro={handleSalvarCadastro}
            onSubstituirCadastro={handleSubstituirCadastro}
            onRevogarCadastro={handleRevogarCadastro}
            onCriarTomador={handleCriarTomador}
            onRevogarTomador={handleRevogarTomador}
            loading={exportacaoLoading}
          />

          {/* Tabela de Códigos de Serviço com Formulário Inline */}
          <TabelaCodigosServico
            servicos={data.servicos}
            competencia={competencia}
            fatorR={data.fator_r}
            onSalvar={handleSalvarParametrizacao}
          />

          {/* Tabela de Histórico de Alterações com Diff Visual */}
          <TabelaHistoricoAlteracoes
            historico={historicoCompleto}
          />
        </>
      )}
    </div>
  )
}
