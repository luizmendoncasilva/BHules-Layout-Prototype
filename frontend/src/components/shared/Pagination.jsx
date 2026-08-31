import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import {
  IconButton, Tooltip, TooltipTrigger, TooltipContent,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@bhubai/bhub-design-system'

export default function Pagination({ page, totalPages, totalItems, pageSize, onPageChange, onPageSizeChange }) {
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)

  return (
    <div className="px-6 py-3 border-t border-border flex items-center justify-between text-sm text-muted-foreground bg-card shrink-0">
      {/* Page size */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Linhas por página</span>
        <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
          <SelectTrigger className="w-20 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
            <SelectItem value="200">200</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Info + Controls */}
      <div className="flex items-center gap-4">
        <span className="text-muted-foreground">
          {from}–{to} de {totalItems}
        </span>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton
                aria-label="Primeira página"
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => onPageChange(1)}
              >
                <ChevronsLeft className="w-4 h-4" />
              </IconButton>
            </TooltipTrigger>
            <TooltipContent>Primeira página</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton
                aria-label="Página anterior"
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </IconButton>
            </TooltipTrigger>
            <TooltipContent>Página anterior</TooltipContent>
          </Tooltip>
          <span className="px-3 text-foreground font-medium text-sm">
            {page} / {totalPages}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton
                aria-label="Próxima página"
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </IconButton>
            </TooltipTrigger>
            <TooltipContent>Próxima página</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton
                aria-label="Última página"
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => onPageChange(totalPages)}
              >
                <ChevronsRight className="w-4 h-4" />
              </IconButton>
            </TooltipTrigger>
            <TooltipContent>Última página</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
