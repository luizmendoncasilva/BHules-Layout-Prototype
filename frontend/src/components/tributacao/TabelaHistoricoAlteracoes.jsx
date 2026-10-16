import React from 'react'
import { History, User, Calendar, ArrowRight, ShieldCheck } from 'lucide-react'
import {
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@bhubai/bhub-design-system'

function formatDate(isoStr) {
  if (!isoStr) return '—'
  try {
    const d = new Date(isoStr)
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(isoStr)
  }
}

function formatCompetenciaDisplay(comp) {
  if (!comp) return '—'
  const s = String(comp).trim()
  if (s.length === 6 && !s.includes('/')) {
    return `${s.slice(4, 6)}/${s.slice(0, 4)}`
  }
  return s
}

export function TabelaHistoricoAlteracoes({ historico = [] }) {
  return (
    <Card padding="none" className="gap-0 overflow-hidden">
      {/* Cabeçalho */}
      <div className="px-6 py-4 border-b border-border bg-muted flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-border text-foreground rounded">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Histórico de Alterações
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              como estava, como ficou, a partir de quando vale, quem fez e por quê
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <ShieldCheck className="w-4 h-4 text-success-text" />
          Auditoria Fiscal Ativa
        </div>
      </div>

      {/* Tabela */}
      <Table className="min-w-full text-left text-xs">
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead scope="col" className="px-4 py-3 h-auto text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quando</TableHead>
            <TableHead scope="col" className="px-4 py-3 h-auto text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quem</TableHead>
            <TableHead scope="col" className="px-3 py-3 h-auto text-xs font-semibold uppercase tracking-wider text-muted-foreground">Código</TableHead>
            <TableHead scope="col" className="px-3 py-3 h-auto text-xs font-semibold uppercase tracking-wider text-muted-foreground">Campo</TableHead>
            <TableHead scope="col" className="px-4 py-3 min-w-[200px] h-auto text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alteração</TableHead>
            <TableHead scope="col" className="px-3 py-3 h-auto text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vigência</TableHead>
            <TableHead scope="col" className="px-4 py-3 min-w-[220px] h-auto text-xs font-semibold uppercase tracking-wider text-muted-foreground">Motivo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-card">
          {historico.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={7} className="px-6 py-8 text-xs text-center text-muted-foreground italic">
                Nenhuma alteração de parametrização registrada para esta empresa até o momento.
              </TableCell>
            </TableRow>
          ) : (
            historico.map((item) => (
              <TableRow key={item.id} className="hover:bg-muted">
                {/* QUANDO */}
                <TableCell className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{formatDate(item.quando)}</span>
                  </div>
                </TableCell>

                {/* QUEM */}
                <TableCell className="px-4 py-3 whitespace-nowrap font-medium text-foreground text-xs">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{item.quem || 'sistema'}</span>
                  </div>
                </TableCell>

                {/* CÓDIGO */}
                <TableCell className="px-3 py-3 whitespace-nowrap font-mono font-bold text-foreground text-xs">
                  {item.subitem_lc116 || 'TODOS'}
                </TableCell>

                {/* CAMPO */}
                <TableCell className="px-3 py-3 whitespace-nowrap text-muted-foreground text-xs">
                  <span className="bg-muted px-2 py-0.5 rounded text-[11px] font-mono">
                    {item.campo}
                  </span>
                </TableCell>

                {/* ALTERAÇÃO COM DIFF VISUAL */}
                <TableCell className="px-4 py-3 whitespace-nowrap text-xs">
                  {item.valor_anterior ? (
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-destructive-subtle text-destructive-text line-through text-[11px] font-medium border border-destructive-border">
                        {item.valor_anterior}
                      </span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="px-2 py-0.5 rounded bg-success-subtle text-success-text font-bold text-[11px] border border-success-border">
                        {item.valor_novo}
                      </span>
                    </div>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-success-subtle text-success-text font-bold text-[11px] border border-success-border">
                      {item.valor_novo}
                    </span>
                  )}
                </TableCell>

                {/* VIGÊNCIA */}
                <TableCell className="px-3 py-3 whitespace-nowrap text-foreground font-medium text-xs">
                  a partir de {formatCompetenciaDisplay(item.vigencia_inicio)}
                </TableCell>

                {/* MOTIVO */}
                <TableCell className="px-4 py-3 text-foreground max-w-sm truncate text-xs" title={item.motivo}>
                  {item.motivo || '—'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  )
}
