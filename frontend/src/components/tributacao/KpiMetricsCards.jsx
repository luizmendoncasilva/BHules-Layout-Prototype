import React from 'react'
import { FileText, DollarSign, XCircle, Calculator } from 'lucide-react'
import { Card } from '@bhubai/bhub-design-system'

function formatMoney(value) {
  const num = typeof value === 'number' ? value : parseFloat(value || 0)
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num)
}

function formatInt(value) {
  const num = typeof value === 'number' ? value : parseInt(value || 0, 10)
  return new Intl.NumberFormat('pt-BR').format(num)
}

export function KpiMetricsCards({ kpis, periodoTexto }) {
  const totalNotas = kpis?.total_notas || 0
  const valorBruto = kpis?.valor_bruto || 0
  const valorCanceladas = kpis?.valor_canceladas || 0
  const notasCanceladas = kpis?.notas_canceladas || 0
  const baseTributavel = kpis?.base_tributavel || 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. NOTAS EMITIDAS */}
      <Card padding="none" className="gap-0 p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Notas Emitidas
          </span>
          <div className="p-1.5 bg-info-subtle text-info-text rounded">
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold text-foreground tracking-tight">
            {formatInt(totalNotas)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {periodoTexto || 'período da competência'}
          </div>
        </div>
      </Card>

      {/* 2. VALOR BRUTO */}
      <Card padding="none" className="gap-0 p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Valor Bruto
          </span>
          <div className="p-1.5 bg-success-subtle text-success-text rounded">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold text-foreground tracking-tight">
            {formatMoney(valorBruto)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            soma de todas as emitidas
          </div>
        </div>
      </Card>

      {/* 3. CANCELADAS */}
      <Card padding="none" className="gap-0 p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Canceladas
          </span>
          <div className="p-1.5 bg-destructive-subtle text-destructive-text rounded">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold text-destructive-text tracking-tight">
            {valorCanceladas > 0 ? `-${formatMoney(valorCanceladas)}` : 'R$ 0,00'}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {notasCanceladas} {notasCanceladas === 1 ? 'nota abatida' : 'notas abatidas'} na competência
          </div>
        </div>
      </Card>

      {/* 4. BASE TRIBUTÁVEL */}
      <Card padding="none" className="gap-0 p-4 border-success-border bg-gradient-to-br from-card to-success-subtle/30 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-success-text">
            Base Tributável
          </span>
          <div className="p-1.5 bg-success-subtle text-success-text rounded">
            <Calculator className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-extrabold text-success-text tracking-tight">
            {formatMoney(baseTributavel)}
          </div>
          <div className="text-xs text-success-text mt-1 font-medium">
            bruto (já sem canceladas)
          </div>
        </div>
      </Card>
    </div>
  )
}
