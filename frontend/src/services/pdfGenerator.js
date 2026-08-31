/**
 * Bulk PDF generator using html2pdf.js + JSZip
 *
 * Generates PDFs for invoice detail pages and packages them into a ZIP.
 * Fetches items + escrituração for each invoice to include full data.
 */

import html2pdf from 'html2pdf.js'
import { api } from '../api/client'

// O PDF é montado como uma string de HTML renderizada fora da árvore React
// (html2pdf.js captura um <div> desconectado do documento), então não dá
// pra usar var(--token) do design system aqui — as variáveis CSS do :root
// do app não chegam nesse contexto. Os hexcodes abaixo espelham os valores
// exatos dos tokens do @bhubai/bhub-design-system (design-system/src/styles.css)
// pra manter a paleta consistente com o resto do app.
const PDF_COLORS = {
  foregroundAlt: '#404040',   // --foreground-alt
  mutedForeground: '#737373', // --muted-foreground
  border: '#e5e5e5',          // --border
  muted: '#f5f5f5',           // --muted
  info: '#2563eb',            // --info / --info-text
  success: '#16a34a',         // --success / --success-text
  warning: '#d97706',         // --warning-text
  destructive: '#dc2626',     // --destructive / --destructive-text
  destructiveSubtle: '#fef2f2', // --destructive-subtle
  destructiveBorder: '#fecaca', // --color-red-200 (borda leve sobre fundo destructive-subtle)
  successSubtle: '#f0fdf4',   // --success-subtle
  successBorder: '#bbf7d0',   // --color-green-200
}

const formatCurrency = (val) => {
  if (val == null) return '-'
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const escapeHtml = (str) => {
  if (!str) return ''
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Generate a single PDF blob from invoice data with items + escrituração
 */
async function generateInvoicePdf(invoice) {
  // Fetch items and escrituração data
  let items = []
  let escrituracao = null
  try {
    items = await api.getInvoiceItems(invoice.id)
  } catch { /* no items */ }
  try {
    escrituracao = await api.getEscrituracao(invoice.id)
  } catch { /* no escrituração */ }

  const sugestoes = escrituracao?.sugestoes || []
  const sugestaoMap = {}
  for (const s of sugestoes) {
    sugestaoMap[s.invoice_item_id] = s
  }

  const container = document.createElement('div')
  container.style.width = '210mm'
  container.style.padding = '12mm'
  container.style.fontFamily = 'Arial, sans-serif'
  container.style.fontSize = '9px'
  container.style.color = PDF_COLORS.foregroundAlt
  container.style.lineHeight = '1.4'

  // Build items table rows
  const itemRows = (items || []).map((it, idx) => {
    const sug = sugestaoMap[it.id] || {}
    const divCount = (sug.divergencias || []).length
    const divStyle = divCount > 0 ? `background:${PDF_COLORS.destructiveSubtle};` : ''
    return `
      <tr style="${divStyle}">
        <td style="padding:3px 5px;border:1px solid ${PDF_COLORS.border};text-align:center;">${idx + 1}</td>
        <td style="padding:3px 5px;border:1px solid ${PDF_COLORS.border};max-width:120px;overflow:hidden;text-overflow:ellipsis;">${escapeHtml((it.descr_compl || it.descricao || '').slice(0, 50))}</td>
        <td style="padding:3px 5px;border:1px solid ${PDF_COLORS.border};font-family:monospace;">${it.ncm || '-'}</td>
        <td style="padding:3px 5px;border:1px solid ${PDF_COLORS.border};font-family:monospace;">${it.cfop_emitente || '-'}</td>
        <td style="padding:3px 5px;border:1px solid ${PDF_COLORS.border};text-align:right;">${formatCurrency(it.vl_item)}</td>
        <td style="padding:3px 5px;border:1px solid ${PDF_COLORS.border};font-family:monospace;">${sug.finalidade || '-'}</td>
        <td style="padding:3px 5px;border:1px solid ${PDF_COLORS.border};font-family:monospace;">${sug.cfop_entrada || '-'}</td>
        <td style="padding:3px 5px;border:1px solid ${PDF_COLORS.border};font-family:monospace;">${sug.cst_icms_entrada || '-'}</td>
        <td style="padding:3px 5px;border:1px solid ${PDF_COLORS.border};text-align:right;">${formatCurrency(sug.credito_icms?.valor)}</td>
        <td style="padding:3px 5px;border:1px solid ${PDF_COLORS.border};text-align:center;color:${divCount > 0 ? PDF_COLORS.destructive : PDF_COLORS.success};">${divCount > 0 ? divCount + ' div.' : 'OK'}</td>
      </tr>
    `
  }).join('')

  // Divergências list
  const allDivs = sugestoes.flatMap(s =>
    (s.divergencias || []).map(d => ({
      item: s.descricao || `Item #${s.invoice_item_id}`,
      campo: d.campo,
      emitente: d.valor_emitente || '-',
      sugerido: d.valor_sugerido || '-',
    }))
  )

  const divRows = allDivs.map(d => `
    <tr>
      <td style="padding:2px 5px;border:1px solid ${PDF_COLORS.border};">${escapeHtml(d.item?.slice(0, 40))}</td>
      <td style="padding:2px 5px;border:1px solid ${PDF_COLORS.border};font-weight:bold;">${escapeHtml(d.campo)}</td>
      <td style="padding:2px 5px;border:1px solid ${PDF_COLORS.border};">${escapeHtml(d.emitente)}</td>
      <td style="padding:2px 5px;border:1px solid ${PDF_COLORS.border};">${escapeHtml(d.sugerido)}</td>
    </tr>
  `).join('')

  const confianca = escrituracao?.confianca_geral != null
    ? `${(escrituracao.confianca_geral * 100).toFixed(0)}%`
    : '-'
  const nivelConf = escrituracao?.nivel_confianca || '-'

  container.innerHTML = `
    <!-- Header -->
    <div style="border-bottom:3px solid ${PDF_COLORS.info};padding-bottom:8px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:flex-end;">
      <div>
        <h1 style="margin:0;font-size:18px;color:${PDF_COLORS.info};">NF-e ${escapeHtml(invoice.num_doc || '')}</h1>
        <p style="margin:3px 0 0;color:${PDF_COLORS.mutedForeground};font-size:8px;">Chave: ${invoice.chave_nfe || '-'}</p>
      </div>
      <div style="text-align:right;">
        <span style="padding:3px 10px;border-radius:4px;font-size:10px;font-weight:bold;color:white;background:${
          invoice.status_analise === 'CONFORME' ? PDF_COLORS.success :
          invoice.status_analise === 'REQUER_REVISAO' ? PDF_COLORS.warning :
          invoice.status_analise === 'BLOQUEADO' ? PDF_COLORS.destructive : PDF_COLORS.mutedForeground
        };">${invoice.status_analise || 'PENDENTE'}</span>
      </div>
    </div>

    <!-- Dados da NF -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
      <tr>
        <td style="padding:4px 8px;border:1px solid ${PDF_COLORS.border};width:15%;background:${PDF_COLORS.muted};"><strong>Emitente</strong></td>
        <td style="padding:4px 8px;border:1px solid ${PDF_COLORS.border};width:35%;">${escapeHtml(invoice.emit_razao_social)}</td>
        <td style="padding:4px 8px;border:1px solid ${PDF_COLORS.border};width:15%;background:${PDF_COLORS.muted};"><strong>CNPJ</strong></td>
        <td style="padding:4px 8px;border:1px solid ${PDF_COLORS.border};width:35%;">${invoice.emit_cnpj || '-'}</td>
      </tr>
      <tr>
        <td style="padding:4px 8px;border:1px solid ${PDF_COLORS.border};background:${PDF_COLORS.muted};"><strong>UF</strong></td>
        <td style="padding:4px 8px;border:1px solid ${PDF_COLORS.border};">${invoice.emit_uf || '-'}</td>
        <td style="padding:4px 8px;border:1px solid ${PDF_COLORS.border};background:${PDF_COLORS.muted};"><strong>Data Emissão</strong></td>
        <td style="padding:4px 8px;border:1px solid ${PDF_COLORS.border};">${invoice.dt_doc || '-'}</td>
      </tr>
      <tr>
        <td style="padding:4px 8px;border:1px solid ${PDF_COLORS.border};background:${PDF_COLORS.muted};"><strong>Valor Total</strong></td>
        <td style="padding:4px 8px;border:1px solid ${PDF_COLORS.border};">${formatCurrency(invoice.vl_doc)}</td>
        <td style="padding:4px 8px;border:1px solid ${PDF_COLORS.border};background:${PDF_COLORS.muted};"><strong>Nat. Operação</strong></td>
        <td style="padding:4px 8px;border:1px solid ${PDF_COLORS.border};">${escapeHtml(invoice.nat_op)}</td>
      </tr>
      <tr>
        <td style="padding:4px 8px;border:1px solid ${PDF_COLORS.border};background:${PDF_COLORS.muted};"><strong>ICMS</strong></td>
        <td style="padding:4px 8px;border:1px solid ${PDF_COLORS.border};">${formatCurrency(invoice.vl_icms)}</td>
        <td style="padding:4px 8px;border:1px solid ${PDF_COLORS.border};background:${PDF_COLORS.muted};"><strong>Confiança</strong></td>
        <td style="padding:4px 8px;border:1px solid ${PDF_COLORS.border};">${confianca} (${nivelConf})</td>
      </tr>
      <tr>
        <td style="padding:4px 8px;border:1px solid ${PDF_COLORS.border};background:${PDF_COLORS.muted};"><strong>PIS</strong></td>
        <td style="padding:4px 8px;border:1px solid ${PDF_COLORS.border};">${formatCurrency(invoice.vl_pis)}</td>
        <td style="padding:4px 8px;border:1px solid ${PDF_COLORS.border};background:${PDF_COLORS.muted};"><strong>COFINS</strong></td>
        <td style="padding:4px 8px;border:1px solid ${PDF_COLORS.border};">${formatCurrency(invoice.vl_cofins)}</td>
      </tr>
    </table>

    <!-- Items Table -->
    ${items.length > 0 ? `
    <h3 style="margin:12px 0 6px;font-size:11px;color:${PDF_COLORS.info};">Itens e Escrituração (${items.length})</h3>
    <table style="width:100%;border-collapse:collapse;margin-bottom:12px;font-size:8px;">
      <thead>
        <tr style="background:${PDF_COLORS.info};color:white;">
          <th style="padding:3px 5px;border:1px solid ${PDF_COLORS.info};text-align:center;">#</th>
          <th style="padding:3px 5px;border:1px solid ${PDF_COLORS.info};text-align:left;">Descrição</th>
          <th style="padding:3px 5px;border:1px solid ${PDF_COLORS.info};">NCM</th>
          <th style="padding:3px 5px;border:1px solid ${PDF_COLORS.info};">CFOP Emit.</th>
          <th style="padding:3px 5px;border:1px solid ${PDF_COLORS.info};text-align:right;">Valor</th>
          <th style="padding:3px 5px;border:1px solid ${PDF_COLORS.info};">Finalidade</th>
          <th style="padding:3px 5px;border:1px solid ${PDF_COLORS.info};">CFOP Ent.</th>
          <th style="padding:3px 5px;border:1px solid ${PDF_COLORS.info};">CST</th>
          <th style="padding:3px 5px;border:1px solid ${PDF_COLORS.info};text-align:right;">Créd. ICMS</th>
          <th style="padding:3px 5px;border:1px solid ${PDF_COLORS.info};text-align:center;">Status</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>` : ''}

    <!-- Divergências -->
    ${allDivs.length > 0 ? `
    <h3 style="margin:12px 0 6px;font-size:11px;color:${PDF_COLORS.destructive};">Divergências (${allDivs.length})</h3>
    <table style="width:100%;border-collapse:collapse;margin-bottom:12px;font-size:8px;">
      <thead>
        <tr style="background:${PDF_COLORS.destructiveSubtle};color:${PDF_COLORS.destructive};">
          <th style="padding:3px 5px;border:1px solid ${PDF_COLORS.destructiveBorder};text-align:left;">Item</th>
          <th style="padding:3px 5px;border:1px solid ${PDF_COLORS.destructiveBorder};">Campo</th>
          <th style="padding:3px 5px;border:1px solid ${PDF_COLORS.destructiveBorder};">Emitente</th>
          <th style="padding:3px 5px;border:1px solid ${PDF_COLORS.destructiveBorder};">Sugerido</th>
        </tr>
      </thead>
      <tbody>${divRows}</tbody>
    </table>` : ''}

    <!-- Resumo créditos -->
    ${escrituracao?.resumo ? `
    <div style="background:${PDF_COLORS.successSubtle};border:1px solid ${PDF_COLORS.successBorder};border-radius:4px;padding:8px 12px;margin-bottom:12px;">
      <strong style="font-size:10px;color:${PDF_COLORS.success};">Resumo de Créditos</strong>
      <div style="display:flex;gap:20px;margin-top:4px;font-size:9px;">
        <span>ICMS: ${formatCurrency(escrituracao.resumo.total_credito_icms)}</span>
        <span>PIS: ${formatCurrency(escrituracao.resumo.total_credito_pis)}</span>
        <span>COFINS: ${formatCurrency(escrituracao.resumo.total_credito_cofins)}</span>
        <span>IPI: ${formatCurrency(escrituracao.resumo.total_credito_ipi)}</span>
        <span><strong>Total: ${formatCurrency(escrituracao.resumo.total_creditos)}</strong></span>
      </div>
    </div>` : ''}

    <!-- Footer -->
    <div style="border-top:1px solid ${PDF_COLORS.border};padding-top:6px;margin-top:15px;display:flex;justify-content:space-between;">
      <span style="font-size:7px;color:${PDF_COLORS.mutedForeground};">Gerado por BHules Motor de Regras</span>
      <span style="font-size:7px;color:${PDF_COLORS.mutedForeground};">${new Date().toLocaleString('pt-BR')}</span>
    </div>
  `

  document.body.appendChild(container)

  try {
    const blob = await html2pdf()
      .from(container)
      .set({
        margin: 0,
        filename: `NFe_${invoice.num_doc || invoice.id}.pdf`,
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .outputPdf('blob')
    return blob
  } finally {
    document.body.removeChild(container)
  }
}

/**
 * Generate PDFs for multiple invoices and package as ZIP
 * @param {Array} invoices - Array of invoice objects
 * @param {Function} onProgress - Callback (current, total) for progress updates
 * @returns {Promise<Blob>} ZIP blob
 */
export async function generateBulkPdfs(invoices, onProgress) {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()

  for (let i = 0; i < invoices.length; i++) {
    const inv = invoices[i]
    try {
      const pdfBlob = await generateInvoicePdf(inv)
      const filename = `NFe_${inv.num_doc || inv.id}_${inv.emit_cnpj || 'sem_cnpj'}.pdf`
      zip.file(filename, pdfBlob)
    } catch (err) {
      console.error(`Failed to generate PDF for invoice ${inv.id}:`, err)
    }
    if (onProgress) onProgress(i + 1, invoices.length)
  }

  return zip.generateAsync({ type: 'blob' })
}

/**
 * Trigger download of a blob
 */
export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}
