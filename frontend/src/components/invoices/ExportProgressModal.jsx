import { useEffect } from 'react'
import { Loader2, CheckCircle2, AlertTriangle, FileSpreadsheet, Download } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, Button,
} from '@bhubai/bhub-design-system'

/**
 * Modal não-bloqueante de export XLSX assíncrono.
 *
 * `job`: objeto retornado pelo getExportXlsxJob — { status, total_count,
 * file_size_bytes, error_message, download_url, ... }. `null` esconde o
 * modal. Quando `job.status === 'COMPLETED'` o download é disparado
 * automaticamente e o usuário pode clicar de novo se perdeu.
 */
export default function ExportProgressModal({ job, onClose }) {
  // Auto-download na transição para COMPLETED.
  useEffect(() => {
    if (job?.status === 'COMPLETED' && job?.download_url) {
      const a = document.createElement('a')
      a.href = job.download_url
      a.click()
    }
  }, [job?.status, job?.download_url])

  if (!job) return null

  const isPending = job.status === 'PENDING' || job.status === 'PROCESSING'
  const isDone = job.status === 'COMPLETED'
  const isFailed = job.status === 'FAILED'
  const canClose = isDone || isFailed

  return (
    <Sheet open={!!job} onOpenChange={(open) => { if (!open && canClose) onClose() }}>
      <SheetContent
        side="right"
        className="p-0 gap-0"
        showCloseButton={canClose}
        onPointerDownOutside={(e) => { if (!canClose) e.preventDefault() }}
        onEscapeKeyDown={(e) => { if (!canClose) e.preventDefault() }}
      >
        {/* Header */}
        <SheetHeader className="border-b border-border flex-row items-center gap-3 space-y-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-4 h-4 text-primary" />
          </div>
          <div>
            <SheetTitle>Exportar Excel</SheetTitle>
            <p className="text-xs text-muted-foreground">
              {isPending && 'Gerando arquivo...'}
              {isDone && 'Pronto'}
              {isFailed && 'Falhou'}
            </p>
          </div>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {isPending && (
            <div className="flex items-start gap-3">
              <Loader2 className="w-5 h-5 text-primary animate-spin mt-0.5" />
              <div className="text-sm text-muted-foreground">
                Estamos gerando o arquivo no servidor. Você pode continuar usando a tela — o
                download começa automaticamente quando estiver pronto.
              </div>
            </div>
          )}

          {isDone && (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-success-text mt-0.5" />
              <div className="text-sm text-foreground">
                {job.total_count != null && (
                  <p>
                    <strong>{job.total_count.toLocaleString('pt-BR')}</strong> notas exportadas
                    {job.file_size_bytes ? ` · ${formatBytes(job.file_size_bytes)}` : ''}
                  </p>
                )}
                <p className="text-muted-foreground mt-1">
                  O download começou. Se não baixou, clique no botão abaixo.
                </p>
              </div>
            </div>
          )}

          {isFailed && (
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive-text mt-0.5" />
              <div className="text-sm text-foreground">
                <p className="font-medium text-destructive-text">Erro ao gerar o arquivo</p>
                <p className="text-muted-foreground mt-1">
                  {job.error_message || 'Tente de novo com um período menor ou menos empresas.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <SheetFooter className="border-t border-border bg-muted flex-row justify-end gap-2 shrink-0">
          {isDone && job.download_url && (
            <Button asChild>
              <a href={job.download_url}>
                <Download className="w-4 h-4" /> Baixar de novo
              </a>
            </Button>
          )}
          {canClose && (
            <Button variant="ghost" onClick={onClose}>
              Fechar
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
