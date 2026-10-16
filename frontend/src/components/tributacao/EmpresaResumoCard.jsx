import React from 'react'
import { Building2, AlertTriangle, CheckCircle2, Percent, Hash } from 'lucide-react'
import { Badge, Card } from '@bhubai/bhub-design-system'

export function EmpresaResumoCard({ empresa, fatorR }) {
  if (!empresa) return null

  const semParam = empresa.codigos_sem_parametrizacao || 0
  const totalCodigos = empresa.total_codigos || 0

  return (
    <Card padding="none" className="gap-0 p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Lado Esquerdo: Identificação e Regime */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-info-subtle text-info-text rounded-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground leading-tight">
                {empresa.razao_social || 'Razão Social não informada'}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span className="font-mono bg-muted px-2 py-0.5 rounded text-foreground">
                  {empresa.cnpj}
                </span>
                <Badge variant="success">
                  {empresa.regime_tributario === 'SIMPLES'
                    ? 'Simples Nacional'
                    : empresa.regime_tributario || 'Regime não informado'}
                </Badge>
                {empresa.codigo_dominio && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                    Domínio: <strong className="text-foreground">{empresa.codigo_dominio}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito: Fator R e Badges de Status */}
        <div className="flex flex-wrap items-center gap-3">
          {fatorR && (
            <div className="flex items-center gap-2 bg-info-subtle border border-info-border px-3 py-1.5 rounded-md">
              <Percent className="w-4 h-4 text-info-text" />
              <div>
                <div className="text-xs text-info-text font-semibold">
                  Fator R da competência:{' '}
                  {fatorR.percentual !== null && fatorR.percentual !== undefined
                    ? `${fatorR.percentual.toFixed(2).replace('.', ',')}%`
                    : 'não apurado'}
                </div>
                {fatorR.detalhe && (
                  <div className="text-[11px] text-info-text">{fatorR.detalhe}</div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-3 py-1.5 rounded-md">
              {totalCodigos} {totalCodigos === 1 ? 'código de serviço' : 'códigos de serviço'}
            </Badge>

            {semParam > 0 ? (
              <Badge variant="warning" className="gap-1.5 px-3 py-1.5 rounded-md font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-warning-text" />
                {semParam} sem parametrização
              </Badge>
            ) : (
              <Badge variant="success" className="gap-1.5 px-3 py-1.5 rounded-md">
                <CheckCircle2 className="w-3.5 h-3.5 text-success-text" />
                100% parametrizado
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
