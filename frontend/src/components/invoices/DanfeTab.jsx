import { useRef, useState, useCallback } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@bhubai/bhub-design-system'
import { formatCnpj } from '../../utils/cnpj'

/* ── helpers ─────────────────────────────────────────────────────── */

const n = (val, dec = 2) => {
  if (val == null) return '0,00'
  return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

const nCur = (val) => {
  if (val == null) return 'R$ 0,00'
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// CNPJ alfanumérico (RFB jul/2026): formatCnpj de utils/cnpj preserva letras.
const fCnpj = (val) => (val ? formatCnpj(val) : '')

const fDate = (val) => {
  if (!val) return ''
  return new Date(val + 'T00:00:00').toLocaleDateString('pt-BR')
}

const fChave = (c) => c ? c.replace(/(\d{4})/g, '$1 ').trim() : ''

const fNum = (val) => {
  if (!val) return ''
  return String(val).replace(/\D/g, '').padStart(9, '0').replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3')
}

/* ── CSS injected via style tag ──────────────────────────────────── */

// NOTA sobre tamanhos de fonte: o DANFE é um fac-símile de documento fiscal
// oficial (layout SEFAZ) impresso em espaço fixo A4. Os tamanhos abaixo
// (0.45rem–0.7rem) já são todos menores que o menor token de tipografia do
// DS (text-xs = 0.75rem); mapeá-los para text-xs uniformizaria e aumentaria
// esses tamanhos, quebrando a diagramação densa exigida pelo layout oficial.
// Mantidos como rem arbitrários por fidelidade visual — cores convertidas
// para tokens do DS (prioridade). font-weight 700 -> 600 (font-semibold),
// que é o peso mais forte disponível no DS.
const danfeStyles = `
.danfe-container {
  max-width: 900px;
  margin: 0 auto;
  background-color: var(--card);
  padding: 10px;
  font-family: 'Inter', Arial, sans-serif;
  font-size: 0.65rem;
  color: var(--foreground);
  line-height: 1.15;
}
.danfe-container .box {
  border: 1px solid var(--foreground);
  padding: 2px 4px;
  position: relative;
}
.danfe-container .box-title {
  font-size: 0.45rem;
  text-transform: uppercase;
  font-weight: 600;
  display: block;
  line-height: 1;
  margin-bottom: 2px;
}
.danfe-container .box-value {
  font-size: 0.65rem;
  font-weight: 600;
  line-height: 1.1;
}
.danfe-container .box-value-normal {
  font-size: 0.65rem;
  font-weight: 400;
  line-height: 1.1;
}
.danfe-container .section-title {
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  margin: 6px 0 2px 0;
}
.danfe-container .barcode {
  height: 40px;
  width: 80%;
  margin: 5px auto;
  background-image: repeating-linear-gradient(
    to right,
    var(--foreground) 0, var(--foreground) 2px,
    transparent 2px, transparent 4px,
    var(--foreground) 4px, var(--foreground) 5px,
    transparent 5px, transparent 8px,
    var(--foreground) 8px, var(--foreground) 12px,
    transparent 12px, transparent 14px
  );
}
.danfe-container table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.55rem;
}
.danfe-container th,
.danfe-container td {
  border: 1px solid var(--foreground);
  padding: 2px;
  text-align: left;
}
.danfe-container th {
  font-size: 0.45rem;
  font-weight: 600;
  text-transform: uppercase;
  text-align: center;
}
`

/* ── main component ──────────────────────────────────────────────── */

export default function DanfeTab({ invoice, items, analysis }) {
  const ref = useRef(null)
  const [busy, setBusy] = useState(false)

  const download = useCallback(async () => {
    if (!ref.current) return
    setBusy(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default
      const name = `DANFE_${invoice?.num_doc || 'NF'}.pdf`
      await html2pdf().set({
        margin: [3, 3, 3, 3],
        filename: name,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2.5, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      }).from(ref.current).save()
    } catch (e) { console.error(e) }
    finally { setBusy(false) }
  }, [invoice])

  if (!invoice) return null

  const emit = invoice.emit_razao_social || ''
  const dest = analysis?.buyer_razao_social || invoice.dest_razao_social || ''
  const op = invoice.ind_oper

  return (
    <div>
      {/* Inject styles */}
      <style>{danfeStyles}</style>

      {/* Download button */}
      <div className="flex justify-end mb-3">
        <Button onClick={download} disabled={busy}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {busy ? 'Gerando PDF...' : 'Download PDF'}
        </Button>
      </div>

      {/* ═══════════════════════ DANFE ═══════════════════════ */}
      <div ref={ref} className="danfe-container">

        {/* ───── RECIBO (CANHOTO) ───── */}
        <div className="flex border border-foreground mb-4 h-16">
          <div className="w-4/5 border-r border-foreground flex flex-col">
            <div className="box h-1/2 !border-0 !border-b border-foreground">
              <span className="box-title">
                RECEBEMOS DE {emit} OS PRODUTOS E/OU SERVI{'\u00C7'}OS CONSTANTES DA NOTA FISCAL ELETR{'\u00D4'}NICA INDICADA ABAIXO. EMISS{'\u00C3'}O: {fDate(invoice.dt_doc)} VALOR TOTAL: {nCur(invoice.vl_doc)} DESTINAT{'\u00C1'}RIO: {dest} - {invoice.dest_endereco || ''} {invoice.dest_municipio || ''} {invoice.dest_uf || ''}
              </span>
            </div>
            <div className="flex h-1/2">
              <div className="box !border-0 !border-r border-foreground w-1/4">
                <span className="box-title">DATA DE RECEBIMENTO</span>
              </div>
              <div className="box !border-0 w-3/4">
                <span className="box-title">IDENTIFICA{'\u00C7'}{'\u00C3'}O E ASSINATURA DO RECEBEDOR</span>
              </div>
            </div>
          </div>
          <div className="w-1/5 flex flex-col justify-center items-center font-semibold text-sm">
            <span>NF-e</span>
            <span className="text-xs">N{'\u00BA'}. {fNum(invoice.num_doc)}</span>
            <span className="text-xs">S{'\u00E9'}rie {invoice.serie || '001'}</span>
          </div>
        </div>

        {/* Linha de corte */}
        <div className="border-t border-dashed border-foreground mb-4" />

        {/* ───── CABECALHO DANFE ───── */}
        <div className="flex flex-col border border-foreground rounded-sm mb-1">

          {/* Linha 1: Emitente / DANFE / Cod. Barras */}
          <div className="flex w-full border-b border-foreground">
            {/* Emitente */}
            <div className="w-[40%] p-2 flex flex-col justify-center border-r border-foreground text-center">
              <span className="font-semibold text-xs mb-1">{emit}</span>
              <span className="text-[0.6rem] leading-tight">
                {invoice.emit_endereco || ''}<br />
                {invoice.emit_uf || ''} {invoice.emit_fone ? `Fone/Fax: ${invoice.emit_fone}` : ''}
              </span>
            </div>

            {/* DANFE Bloco Central */}
            <div className="w-[20%] p-1 flex flex-col items-center justify-center border-r border-foreground">
              <span className="font-semibold text-lg leading-none">DANFE</span>
              <span className="text-[0.55rem] text-center mb-1">
                Documento Auxiliar da Nota<br />Fiscal Eletr{'\u00F4'}nica
              </span>
              <div className="text-[0.6rem] w-full text-left mb-1 px-2">
                0- ENTRADA{' '}
                <span className={`float-right border border-foreground px-1 font-semibold ${op === '0' ? 'bg-foreground text-background' : ''}`}>
                  {op === '0' ? '0' : ''}
                </span>
                <br />
                1- SA{'\u00CD'}DA{' '}
                <span className={`float-right border border-foreground px-1 font-semibold ${op === '1' ? 'bg-foreground text-background' : ''}`}>
                  {op === '1' ? '1' : ''}
                </span>
              </div>
              <div className="text-[0.65rem] font-semibold text-center mt-1">
                N{'\u00BA'}. {fNum(invoice.num_doc)}<br />
                S{'\u00E9'}rie {invoice.serie || '001'}<br />
                Folha 1/1
              </div>
            </div>

            {/* Chave de Acesso / Código de Barras */}
            <div className="w-[40%] flex flex-col">
              <div className="p-1 h-1/2 flex flex-col justify-center border-b border-foreground">
                <div className="barcode" />
              </div>
              <div className="p-1 h-1/2 flex flex-col justify-between">
                <div>
                  <span className="box-title">CHAVE DE ACESSO</span>
                  <span className="box-value text-[0.7rem] tracking-wide text-center block">
                    {fChave(invoice.chave_nfe)}
                  </span>
                </div>
                <div className="text-center text-[0.55rem] mt-1 text-muted-foreground">
                  Consulta de autenticidade no portal nacional da NF-e<br />
                  www.nfe.fazenda.gov.br/portal ou no site da Sefaz Autorizadora
                </div>
              </div>
            </div>
          </div>

          {/* Linha 2: Natureza / Protocolo */}
          <div className="flex w-full border-b border-foreground">
            <div className="box !border-0 !border-r border-foreground w-3/5">
              <span className="box-title">NATUREZA DA OPERA{'\u00C7'}{'\u00C3'}O</span>
              <span className="box-value">{invoice.nat_op || (op === '0' ? 'ENTRADA' : 'VENDA')}</span>
            </div>
            <div className="box !border-0 w-2/5">
              <span className="box-title">PROTOCOLO DE AUTORIZA{'\u00C7'}{'\u00C3'}O DE USO</span>
              <span className="box-value text-right block pr-2">{invoice.n_prot || ''}</span>
            </div>
          </div>

          {/* Linha 3: Inscrições */}
          <div className="flex w-full">
            <div className="box !border-0 !border-r border-foreground w-1/3">
              <span className="box-title">INSCRI{'\u00C7'}{'\u00C3'}O ESTADUAL</span>
              <span className="box-value">{invoice.ie_emitente || ''}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-1/3">
              <span className="box-title">INSCRI{'\u00C7'}{'\u00C3'}O ESTADUAL DO SUBST. TRIBUT.</span>
              <span className="box-value">{invoice.ie_st || ''}</span>
            </div>
            <div className="box !border-0 w-1/3">
              <span className="box-title">CNPJ/CPF</span>
              <span className="box-value">{fCnpj(invoice.emit_cnpj)}</span>
            </div>
          </div>
        </div>

        {/* ───── DESTINATARIO/REMETENTE ───── */}
        <div className="section-title">DESTINAT{'\u00C1'}RIO/REMETENTE</div>
        <div className="flex flex-col border-t border-l border-foreground">
          <div className="flex w-full border-b border-foreground">
            <div className="box !border-0 !border-r border-foreground w-[60%]">
              <span className="box-title">NOME/RAZ{'\u00C3'}O SOCIAL</span>
              <span className="box-value">{dest}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[25%]">
              <span className="box-title">CNPJ/CPF</span>
              <span className="box-value">{fCnpj(invoice.dest_cnpj)}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[15%]">
              <span className="box-title">DATA DA EMISS{'\u00C3'}O</span>
              <span className="box-value">{fDate(invoice.dt_doc)}</span>
            </div>
          </div>
          <div className="flex w-full border-b border-foreground">
            <div className="box !border-0 !border-r border-foreground w-[45%]">
              <span className="box-title">ENDERE{'\u00C7'}O</span>
              <span className="box-value">{invoice.dest_endereco || ''}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[25%]">
              <span className="box-title">BAIRRO / DISTRITO</span>
              <span className="box-value">{invoice.dest_bairro || ''}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[15%]">
              <span className="box-title">CEP</span>
              <span className="box-value">{invoice.dest_cep || ''}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[15%]">
              <span className="box-title">DATA DA SA{'\u00CD'}DA/ENTRADA</span>
              <span className="box-value">{fDate(invoice.dt_e_s)}</span>
            </div>
          </div>
          <div className="flex w-full border-b border-foreground">
            <div className="box !border-0 !border-r border-foreground w-[40%]">
              <span className="box-title">MUNIC{'\u00CD'}PIO</span>
              <span className="box-value">{invoice.dest_municipio || ''}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[15%]">
              <span className="box-title">FONE/FAX</span>
              <span className="box-value">{invoice.dest_fone || ''}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[10%]">
              <span className="box-title">UF</span>
              <span className="box-value">{invoice.dest_uf || ''}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[20%]">
              <span className="box-title">INSCRI{'\u00C7'}{'\u00C3'}O ESTADUAL</span>
              <span className="box-value">{invoice.ie_destinatario || ''}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[15%]">
              <span className="box-title">HORA DA SA{'\u00CD'}DA/ENTRADA</span>
              <span className="box-value">{invoice.hora_saida || ''}</span>
            </div>
          </div>
        </div>

        {/* ───── CALCULO DO IMPOSTO ───── */}
        <div className="section-title mt-2">C{'\u00C1'}LCULO DO IMPOSTO</div>
        <div className="flex flex-col border-t border-l border-foreground">
          <div className="flex w-full border-b border-foreground">
            <div className="box !border-0 !border-r border-foreground w-[14%]">
              <span className="box-title">BASE DE CALC. DO ICMS</span>
              <span className="box-value block text-right">{n(invoice.vl_bc_icms)}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[12%]">
              <span className="box-title">VALOR DO ICMS</span>
              <span className="box-value block text-right">{n(invoice.vl_icms)}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[14%]">
              <span className="box-title">BASE DE CALC. ICMS S.T.</span>
              <span className="box-value block text-right">{n(invoice.vl_bc_icms_st)}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[12%]">
              <span className="box-title">VALOR DO ICMS SUBST.</span>
              <span className="box-value block text-right">{n(invoice.vl_icms_st)}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[14%]">
              <span className="box-title">V. IMP. IMPORTA{'\u00C7'}{'\u00C3'}O</span>
              <span className="box-value block text-right">{n(invoice.vl_imp_import)}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[12%]">
              <span className="box-title">V. ICMS UF REMET</span>
              <span className="box-value block text-right">{n(invoice.vl_icms_uf_remet)}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[10%]">
              <span className="box-title">V. FCP UF DEST</span>
              <span className="box-value block text-right">{n(invoice.vl_fcp)}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[12%] bg-muted">
              <span className="box-title">V. TOTAL PRODUTOS</span>
              <span className="box-value block text-right">{n(invoice.vl_merc)}</span>
            </div>
          </div>
          <div className="flex w-full border-b border-foreground">
            <div className="box !border-0 !border-r border-foreground w-[14%]">
              <span className="box-title">VALOR DO FRETE</span>
              <span className="box-value block text-right">{n(invoice.vl_frt)}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[12%]">
              <span className="box-title">VALOR DO SEGURO</span>
              <span className="box-value block text-right">{n(invoice.vl_seg)}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[14%]">
              <span className="box-title">DESCONTO</span>
              <span className="box-value block text-right">{n(invoice.vl_desc)}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[12%]">
              <span className="box-title">OUTRAS DESPESAS</span>
              <span className="box-value block text-right">{n(invoice.vl_out_da)}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[14%]">
              <span className="box-title">VALOR TOTAL IPI</span>
              <span className="box-value block text-right">{n(invoice.vl_ipi)}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[12%]">
              <span className="box-title">V. ICMS UF DEST</span>
              <span className="box-value block text-right">{n(invoice.vl_icms_uf_dest)}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[10%]">
              <span className="box-title">V. TOT. TRIB</span>
              <span className="box-value block text-right">{n(invoice.vl_tot_trib)}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[12%] bg-muted">
              <span className="box-title">V. TOTAL DA NOTA</span>
              <span className="box-value block text-right font-semibold">{n(invoice.vl_doc)}</span>
            </div>
          </div>
        </div>

        {/* ───── TRANSPORTADOR ───── */}
        <div className="section-title mt-2">TRANSPORTADOR/VOLUMES TRANSPORTADOS</div>
        <div className="flex flex-col border-t border-l border-foreground">
          <div className="flex w-full border-b border-foreground">
            <div className="box !border-0 !border-r border-foreground w-[40%]">
              <span className="box-title">NOME/RAZ{'\u00C3'}O SOCIAL</span>
              <span className="box-value">
                {invoice.transp_nome || (invoice.ind_frt === '9' ? '9-Sem Transporte' : '')}
              </span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[10%]">
              <span className="box-title">FRETE</span>
              <span className="box-value">
                {invoice.ind_frt === '0' ? '0-Emitente' : invoice.ind_frt === '1' ? '1-Dest.' : invoice.ind_frt === '9' ? '9-S/Frete' : invoice.ind_frt || ''}
              </span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[15%]">
              <span className="box-title">C{'\u00D3'}DIGO ANTT</span>
              <span className="box-value">{invoice.transp_antt || ''}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[10%]">
              <span className="box-title">PLACA DO VEICULO</span>
              <span className="box-value">{invoice.transp_placa || ''}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[5%]">
              <span className="box-title">UF</span>
              <span className="box-value">{invoice.transp_uf || ''}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[20%]">
              <span className="box-title">CNPJ/CPF</span>
              <span className="box-value">{fCnpj(invoice.transp_cnpj)}</span>
            </div>
          </div>
          <div className="flex w-full border-b border-foreground">
            <div className="box !border-0 !border-r border-foreground w-[45%]">
              <span className="box-title">ENDERE{'\u00C7'}O</span>
              <span className="box-value">{invoice.transp_endereco || ''}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[25%]">
              <span className="box-title">MUNIC{'\u00CD'}PIO</span>
              <span className="box-value">{invoice.transp_municipio || ''}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[10%]">
              <span className="box-title">UF</span>
              <span className="box-value">{invoice.transp_uf2 || ''}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[20%]">
              <span className="box-title">INSCRI{'\u00C7'}{'\u00C3'}O ESTADUAL</span>
              <span className="box-value">{invoice.transp_ie || ''}</span>
            </div>
          </div>
          <div className="flex w-full border-b border-foreground">
            <div className="box !border-0 !border-r border-foreground w-[10%]">
              <span className="box-title">QUANTIDADE</span>
              <span className="box-value">{invoice.vol_qtd || ''}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[25%]">
              <span className="box-title">ESP{'\u00C9'}CIE</span>
              <span className="box-value">{invoice.vol_esp || ''}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[20%]">
              <span className="box-title">MARCA</span>
              <span className="box-value">{invoice.vol_marca || ''}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[15%]">
              <span className="box-title">NUMERA{'\u00C7'}{'\u00C3'}O</span>
              <span className="box-value">{invoice.vol_num || ''}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[15%]">
              <span className="box-title">PESO BRUTO</span>
              <span className="box-value">{invoice.vol_peso_b ? n(invoice.vol_peso_b, 3) : ''}</span>
            </div>
            <div className="box !border-0 !border-r border-foreground w-[15%]">
              <span className="box-title">PESO L{'\u00CD'}QUIDO</span>
              <span className="box-value">{invoice.vol_peso_l ? n(invoice.vol_peso_l, 3) : ''}</span>
            </div>
          </div>
        </div>

        {/* ───── PRODUTOS ───── */}
        <div className="section-title mt-2">DADOS DOS PRODUTOS/SERVI{'\u00C7'}OS</div>
        <div className="w-full mb-2">
          <table>
            <thead>
              <tr>
                <th className="w-[8%]">C{'\u00D3'}DIGO PRODUTO</th>
                <th className="w-[32%]">DESCRI{'\u00C7'}{'\u00C3'}O DO PRODUTO/SERVI{'\u00C7'}O</th>
                <th className="w-[6%]">NCM/SH</th>
                <th className="w-[4%]">CST</th>
                <th className="w-[4%]">CFOP</th>
                <th className="w-[3%]">UN</th>
                <th className="w-[6%]">QUANT</th>
                <th className="w-[7%]">VALOR UNIT</th>
                <th className="w-[8%]">VALOR TOTAL</th>
                <th className="w-[6%]">B.CALC ICMS</th>
                <th className="w-[5%]">VALOR ICMS</th>
                <th className="w-[5%]">VALOR IPI</th>
                <th className="w-[3%]">AL{'\u00CD'}Q. ICMS</th>
                <th className="w-[3%]">AL{'\u00CD'}Q. IPI</th>
              </tr>
            </thead>
            <tbody>
              {(items || []).map((it, i) => {
                const unitVal = it.vl_un_com || (it.qtd ? it.vl_item / it.qtd : 0)
                return (
                  <tr key={it.id || i}>
                    <td>{it.cod_item || ''}</td>
                    <td>{it.descr_compl || ''}</td>
                    <td className="text-center">{it.ncm || ''}</td>
                    <td className="text-center">{it.orig != null ? it.orig : '0'}/{it.cst_icms || ''}</td>
                    <td className="text-center">{it.cfop_emitente || ''}</td>
                    <td className="text-center">{it.unid || ''}</td>
                    <td className="text-right">{n(it.qtd, 4)}</td>
                    <td className="text-right">{n(unitVal, 4)}</td>
                    <td className="text-right">{n(it.vl_item)}</td>
                    <td className="text-right">{n(it.vl_bc_icms)}</td>
                    <td className="text-right">{n(it.vl_icms)}</td>
                    <td className="text-right">{n(it.vl_ipi)}</td>
                    <td className="text-right">{it.aliq_icms != null ? n(it.aliq_icms) : ''}</td>
                    <td className="text-right">{it.aliq_ipi != null ? n(it.aliq_ipi) : ''}</td>
                  </tr>
                )
              })}
              {(!items || items.length === 0) && (
                <tr>
                  <td colSpan={14} className="text-center" style={{ padding: 12, color: 'var(--muted-foreground)' }}>
                    Nenhum item
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ───── DADOS ADICIONAIS ───── */}
        <div className="section-title mt-2">DADOS ADICIONAIS</div>
        <div className="flex w-full border border-foreground min-h-30">
          <div className="w-[70%] p-1 flex flex-col border-r border-foreground">
            <span className="box-title">INFORMA{'\u00C7'}{'\u00D5'}ES COMPLEMENTARES</span>
            <div className="box-value-normal mt-1 text-[0.55rem] leading-tight">
              {invoice.inf_cpl && <div>{invoice.inf_cpl}</div>}
              {(items || []).filter(it => it.inf_ad_prod).map(it => (
                <div key={it.id}>
                  <span style={{ fontFamily: 'Courier New, monospace', color: 'var(--muted-foreground)' }}>Item {it.num_item}:</span>{' '}
                  {it.inf_ad_prod}
                </div>
              ))}
            </div>
          </div>
          <div className="w-[30%] p-1 flex flex-col">
            <span className="box-title">RESERVADO AO FISCO</span>
          </div>
        </div>

      </div>
    </div>
  )
}
