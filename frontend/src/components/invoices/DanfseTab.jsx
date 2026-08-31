import { useRef, useState, useCallback } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@bhubai/bhub-design-system'
import { formatCnpj } from '../../utils/cnpj'

/* ── helpers ─────────────────────────────────────────────────────── */

const cur = (val) => {
  if (val == null || val === '' || val === undefined) return '-'
  const n = Number(val)
  if (isNaN(n)) return '-'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const pct = (val) => {
  if (val == null || val === '') return '-'
  const n = Number(val)
  if (isNaN(n)) return '-'
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) + '%'
}

// CNPJ alfanumérico (RFB jul/2026): formatCnpj de utils/cnpj preserva letras.
const fDoc = (val) => formatCnpj(val)

const fDate = (val) => {
  if (!val) return '-'
  const s = String(val)
  const d = new Date(s.includes('T') ? s : s + 'T00:00:00')
  return d.toLocaleDateString('pt-BR')
}

const fDateTime = (val) => {
  if (!val) return '-'
  const s = String(val)
  const d = new Date(s.includes('T') ? s : s + 'T00:00:00')
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const fChave = (c) => {
  if (!c) return '-'
  return String(c).replace(/(.{4})/g, '$1 ').trim()
}

const v = (val) => val || '-'

/* ── component ───────────────────────────────────────────────────── */

export default function DanfseTab({ invoice, analysis }) {
  const ref = useRef(null)
  const [busy, setBusy] = useState(false)

  const download = useCallback(async () => {
    if (!ref.current) return
    setBusy(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default
      await html2pdf().set({
        margin: [4, 4, 4, 4],
        filename: `DANFSe_${invoice?.num_doc || 'NFS-e'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2.5, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      }).from(ref.current).save()
    } catch (e) { console.error(e) }
    finally { setBusy(false) }
  }, [invoice])

  if (!invoice) return null

  /* ── data extraction ─── */
  const ret = analysis?.retencoes || {}
  const cls = analysis?.classification || {}
  const vlq = analysis?.valor_liquido || {}

  const issRet = ret.iss || {}
  const irrf = ret.irrf || {}
  const pcc = ret.pcc || {}
  const inss = ret.inss || {}

  const valorServicos = invoice.valor_servicos || invoice.vl_doc
  const valorDeducoes = invoice.valor_deducoes
  const bcIss = issRet.base || valorServicos
  const aliqIss = issRet.aliquota || invoice.aliquota_iss
  const valorIss = issRet.valor_nfse || issRet.valor_esperado || invoice.valor_iss
  const issRetido = issRet.retido_tomador ?? invoice.iss_retido

  const valorIrrf = irrf.valor_nfse || irrf.valor_esperado || invoice.valor_ir_retido
  const valorInss = inss.valor_nfse || inss.valor_esperado || invoice.valor_inss_retido
  const valorPis = pcc.pis_nfse || invoice.valor_pis_retido
  const valorCofins = pcc.cofins_nfse || invoice.valor_cofins_retido
  const valorCsll = pcc.csll_nfse || invoice.valor_csll_retido
  const valorPcc = pcc.valor_nfse || pcc.valor_esperado || (
    (Number(valorPis) || 0) + (Number(valorCofins) || 0) + (Number(valorCsll) || 0) || null
  )

  const totalRetFed = [valorIrrf, valorInss, valorPcc]
    .reduce((s, x) => s + (Number(x) || 0), 0)

  const issRetidoValor = issRetido ? (Number(valorIss) || 0) : 0
  const valorLiquido = vlq.valor_liquido || invoice.valor_liquido_nfse || invoice.vl_doc

  const regimeLabel = cls.regime_prestador || invoice.regime_prestador
  const simplesLabel = (() => {
    if (cls.is_simples) return 'Optante pelo Simples Nacional'
    if (cls.is_mei) return 'MEI - Microempreendedor Individual'
    if (!regimeLabel) return '-'
    const l = regimeLabel.toLowerCase()
    if (l.includes('simples')) return 'Optante pelo Simples Nacional'
    if (l.includes('mei')) return 'MEI'
    return 'Nao optante'
  })()

  // NOTA sobre tamanhos de fonte: DANFSe é fac-símile de documento fiscal
  // oficial (layout ABRASF/DANFSe) em espaço fixo A4. Os tamanhos usados
  // aqui (0.45rem-1.3rem, na maioria abaixo do menor token do DS, que é
  // text-xs=0.75rem) foram mantidos como rem arbitrários para preservar a
  // diagramação densa do documento oficial — mapear tudo para text-xs
  // aumentaria e uniformizaria esses tamanhos, quebrando o layout. Cores
  // convertidas para tokens do DS (prioridade); font-weight 700/800 -> 600
  // (font-semibold, o peso mais forte disponível no DS).
  /* ── Cell component ─── */
  const C = ({ label, children, bold, flex, align, bg }) => (
    <td style={{
      padding: '4px 6px',
      verticalAlign: 'top',
      ...(flex ? { width: flex } : {}),
      ...(bg ? { background: bg } : {}),
      ...(align ? { textAlign: align } : {}),
    }}>
      <div style={{ fontSize: '0.5rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', lineHeight: 1.1, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: bold ? '0.72rem' : '0.68rem', fontWeight: bold ? 600 : 400, lineHeight: 1.2, color: 'var(--foreground)' }}>{children}</div>
    </td>
  )

  /* ── Section header ─── */
  const SH = ({ children }) => (
    <tr>
      <td colSpan={99} style={{ background: 'var(--foreground)', color: 'var(--card)', fontWeight: 600, fontSize: '0.6rem', textTransform: 'uppercase', padding: '4px 6px', letterSpacing: '0.03em' }}>
        {children}
      </td>
    </tr>
  )

  return (
    <div>
      {/* Download */}
      <div className="flex justify-end mb-3">
        <Button onClick={download} disabled={busy}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {busy ? 'Gerando PDF...' : 'Download PDF'}
        </Button>
      </div>

      {/* ═══════════════ DANFSe ═══════════════ */}
      <div ref={ref} style={{
        maxWidth: 880,
        margin: '0 auto',
        background: 'var(--card)',
        fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
        fontSize: '0.68rem',
        color: 'var(--foreground)',
        lineHeight: 1.3,
      }}>

        {/* ─── HEADER ─── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid var(--foreground)', marginBottom: 4 }}>
          <tbody>
            <tr>
              {/* Logo */}
              <td style={{ width: 90, padding: 8, borderRight: '1px solid var(--foreground)', textAlign: 'center', verticalAlign: 'middle' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--info-text)', lineHeight: 1 }}>NFS-e</div>
                <div style={{ fontSize: '0.45rem', color: 'var(--muted-foreground)', marginTop: 2 }}>Nota Fiscal de{'\n'}Servico Eletronica</div>
              </td>
              {/* Title */}
              <td style={{ padding: '8px 12px', textAlign: 'center', verticalAlign: 'middle', borderRight: '1px solid var(--foreground)' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 600, letterSpacing: '0.05em', color: 'var(--foreground)' }}>DANFSe v1.0</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--muted-foreground)', marginTop: 2 }}>Documento Auxiliar da Nota Fiscal de Servico Eletronica</div>
              </td>
              {/* QR */}
              <td style={{ width: 120, padding: 8, textAlign: 'center', verticalAlign: 'middle' }}>
                <div style={{ width: 56, height: 56, border: '1px solid var(--border)', margin: '0 auto 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2 }}>
                  <span style={{ fontSize: '0.45rem', color: 'var(--muted-foreground)' }}>QR Code</span>
                </div>
                <div style={{ fontSize: '0.45rem', color: 'var(--muted-foreground)', lineHeight: 1.2 }}>Consulte no portal<br />nacional da NFS-e</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ─── CHAVE DE ACESSO ─── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid var(--foreground)', marginBottom: 4 }}>
          <tbody>
            <tr>
              <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.5rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: 2 }}>Chave de Acesso da NFS-e</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, fontFamily: "'Courier New', monospace", letterSpacing: '1.5px', color: 'var(--foreground)' }}>{fChave(invoice.chave_nfe)}</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ─── DADOS BASICOS ─── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid var(--foreground)', marginBottom: 4 }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <C label="Numero da NFS-e" bold flex="18%">{v(invoice.num_doc)}</C>
              <C label="Competencia da NFS-e" flex="22%">{fDate(invoice.dt_doc)}</C>
              <C label="Data e Hora da emissao da NFS-e" flex="28%">{fDateTime(invoice.dt_doc)}</C>
              <td style={{ width: 0, padding: 0 }} />
            </tr>
            <tr>
              <C label="Numero da DPS" bold flex="18%">{v(invoice.num_doc)}</C>
              <C label="Serie da DPS" flex="22%">{v(invoice.serie)}</C>
              <C label="Data e Hora da emissao da DPS" flex="28%">{fDateTime(invoice.dt_doc)}</C>
              <td style={{ width: 0, padding: 0 }} />
            </tr>
          </tbody>
        </table>

        {/* ─── EMITENTE / PRESTADOR ─── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid var(--foreground)', marginBottom: 4 }}>
          <tbody>
            <SH>Emitente da NFS-e &mdash; Prestador do Servico</SH>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <C label="CNPJ / CPF / NIF" bold flex="35%">{fDoc(invoice.cnpj_prestador_full || invoice.emit_cnpj)}</C>
              <C label="Inscricao Municipal" flex="30%">{v(invoice.ie_emitente)}</C>
              <C label="Telefone" flex="20%">{v(invoice.emit_fone)}</C>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <C label="Nome / Nome Empresarial" bold>{v(invoice.emit_razao_social)}</C>
              <C label="E-mail" flex="35%">{v(invoice.emit_email)}</C>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <C label="Endereco">{v(invoice.emit_endereco)}</C>
              <C label="Municipio" flex="25%">{v(invoice.emit_municipio)} {invoice.emit_uf ? `- ${invoice.emit_uf}` : ''}</C>
              <C label="CEP" flex="12%">{v(invoice.emit_cep)}</C>
            </tr>
            <tr>
              <C label="Simples Nacional na Data de Competencia">{simplesLabel}</C>
              <C label="Regime de Apuracao Tributaria pelo SN" flex="35%">{v(regimeLabel)}</C>
            </tr>
          </tbody>
        </table>

        {/* ─── TOMADOR ─── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid var(--foreground)', marginBottom: 4 }}>
          <tbody>
            <SH>Tomador do Servico</SH>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <C label="CNPJ / CPF / NIF" bold flex="35%">{fDoc(invoice.dest_cnpj)}</C>
              <C label="Inscricao Municipal" flex="30%">{v(invoice.ie_destinatario)}</C>
              <C label="Telefone" flex="20%">{v(invoice.dest_fone)}</C>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <C label="Nome / Nome Empresarial" bold>{v(invoice.dest_razao_social)}</C>
              <C label="E-mail" flex="35%">{v(invoice.dest_email)}</C>
            </tr>
            <tr>
              <C label="Endereco">{v(invoice.dest_endereco)}</C>
              <C label="Municipio" flex="25%">{v(invoice.dest_municipio)} {invoice.dest_uf ? `- ${invoice.dest_uf}` : ''}</C>
              <C label="CEP" flex="12%">{v(invoice.dest_cep)}</C>
            </tr>
          </tbody>
        </table>

        {/* ─── INTERMEDIARIO ─── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--muted-foreground)', marginBottom: 4 }}>
          <tbody>
            <tr>
              <td style={{ padding: '4px 8px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.6rem', fontStyle: 'italic', textTransform: 'uppercase' }}>
                Intermediario do Servico nao identificado na NFS-e
              </td>
            </tr>
          </tbody>
        </table>

        {/* ─── SERVICO PRESTADO ─── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid var(--foreground)', marginBottom: 4 }}>
          <tbody>
            <SH>Servico Prestado</SH>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <C label="Codigo de Tributacao Nacional" bold flex="30%">{v(cls.codigo_servico || invoice.codigo_servico_lc116)}</C>
              <C label="Codigo de Tributacao Municipal" flex="25%">{v(invoice.codigo_servico_municipal)}</C>
              <C label="Local da Prestacao" flex="25%">{v(cls.municipio_incidencia || invoice.emit_municipio)} {invoice.emit_uf ? `- ${invoice.emit_uf}` : ''}</C>
              <C label="Pais da Prestacao" flex="15%">Brasil</C>
            </tr>
            <tr>
              <td colSpan={4} style={{ padding: '6px 8px' }}>
                <div style={{ fontSize: '0.5rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: 3 }}>Descricao do Servico</div>
                <div style={{ fontSize: '0.68rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', color: 'var(--foreground)' }}>
                  {v(cls.descricao_servico || invoice.discriminacao_servico || invoice.info_complementares)}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ─── TRIBUTACAO MUNICIPAL ─── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid var(--foreground)', marginBottom: 4 }}>
          <tbody>
            <SH>Tributacao Municipal</SH>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <C label="Tributacao do ISSQN" flex="25%">{invoice.valor_iss != null || valorIss ? 'Operacao Tributavel' : '-'}</C>
              <C label="Pais Resultado da Prestacao" flex="25%">-</C>
              <C label="Municipio de Incidencia do ISSQN" flex="25%">{v(cls.municipio_incidencia || invoice.emit_municipio)}</C>
              <C label="Regime Especial de Tributacao" flex="25%">Nenhum</C>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <C label="Tipo de Imunidade">-</C>
              <C label="Suspensao da Exigibilidade do ISSQN">Nao</C>
              <C label="Numero Processo Suspensao">-</C>
              <C label="Beneficio Municipal">-</C>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
              <C label="Valor do Servico" bold bg="var(--muted)">{cur(valorServicos)}</C>
              <C label="Desconto Incondicionado" bg="var(--muted)">{cur(invoice.vl_desc)}</C>
              <C label="Total Deducoes/Reducoes" bg="var(--muted)">{cur(valorDeducoes)}</C>
              <C label="Calculo do BM" bg="var(--muted)">-</C>
            </tr>
            <tr style={{ background: 'var(--info-subtle)' }}>
              <C label="BC ISSQN" bold bg="var(--info-subtle)">{cur(bcIss)}</C>
              <C label="Aliquota Aplicada" bold bg="var(--info-subtle)">{pct(aliqIss)}</C>
              <C label="Retencao do ISSQN" bold bg="var(--info-subtle)">
                <span className={issRetido ? 'text-destructive-text font-semibold' : 'text-success-text font-semibold'}>
                  {issRetido ? 'Retido' : 'Nao Retido'}
                </span>
              </C>
              <C label="ISSQN Apurado" bold bg="var(--info-subtle)">{cur(valorIss)}</C>
            </tr>
          </tbody>
        </table>

        {/* ─── TRIBUTACAO FEDERAL ─── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid var(--foreground)', marginBottom: 4 }}>
          <tbody>
            <SH>Tributacao Federal</SH>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <C label="IRRF" bold flex="25%">
                {cur(valorIrrf)}
                {irrf.aliquota ? <span style={{ fontSize: '0.5rem', color: 'var(--muted-foreground)', marginLeft: 4 }}>({pct(irrf.aliquota)})</span> : null}
              </C>
              <C label="Contribuicao Previdenciaria - Retida" flex="25%">{cur(valorInss)}</C>
              <C label="Contribuicoes Sociais - Retidas" flex="25%">{cur(valorPcc)}</C>
              <C label="Descricao Contrib. Sociais" flex="25%">
                {valorPcc && Number(valorPcc) > 0 ? 'PIS/COFINS/CSLL' : '-'}
              </C>
            </tr>
            <tr>
              <C label="PIS - Retido" flex="25%">{cur(valorPis)}</C>
              <C label="COFINS - Retido" flex="25%">{cur(valorCofins)}</C>
              <C label="CSLL - Retido" flex="25%">{cur(valorCsll)}</C>
              <C label="INSS - Retido" flex="25%">{cur(valorInss)}</C>
            </tr>
          </tbody>
        </table>

        {/* ─── VALOR TOTAL ─── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid var(--foreground)', marginBottom: 4 }}>
          <tbody>
            <SH>Valor Total da NFS-e</SH>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <C label="Valor do Servico" bold>{cur(valorServicos)}</C>
              <C label="Desconto Condicionado">-</C>
              <C label="Desconto Incondicionado">{cur(invoice.vl_desc)}</C>
              <C label="ISSQN Retido">{issRetidoValor ? cur(issRetidoValor) : '-'}</C>
            </tr>
            <tr style={{ background: 'var(--success-subtle)' }}>
              <C label="Total das Retencoes Federais" bg="var(--success-subtle)">{totalRetFed ? cur(totalRetFed) : '-'}</C>
              <C label="PIS/COFINS - Debito Apur. Propria" bg="var(--success-subtle)">-</C>
              <td colSpan={2} style={{ padding: '6px 8px', background: 'var(--success-subtle)', verticalAlign: 'top' }}>
                <div style={{ fontSize: '0.5rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: 2 }}>Valor Liquido da NFS-e</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--foreground)' }}>{cur(valorLiquido)}</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ─── TOTAIS APROXIMADOS ─── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid var(--foreground)', marginBottom: 4 }}>
          <tbody>
            <SH>Totais Aproximados dos Tributos</SH>
            <tr>
              <td style={{ padding: '6px 8px', textAlign: 'center', width: '33.3%', borderRight: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.5rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: 2 }}>Federais</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{cur(totalRetFed || 0)}</div>
              </td>
              <td style={{ padding: '6px 8px', textAlign: 'center', width: '33.3%', borderRight: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.5rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: 2 }}>Estaduais</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{cur(0)}</div>
              </td>
              <td style={{ padding: '6px 8px', textAlign: 'center', width: '33.3%' }}>
                <div style={{ fontSize: '0.5rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: 2 }}>Municipais</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{cur(valorIss || 0)}</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ─── INFO COMPLEMENTARES ─── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid var(--foreground)' }}>
          <tbody>
            <SH>Informacoes Complementares</SH>
            <tr>
              <td style={{ padding: '8px', minHeight: 50, fontSize: '0.65rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', color: 'var(--foreground)' }}>
                {v(invoice.info_complementares || invoice.inf_cpl)}
              </td>
            </tr>
          </tbody>
        </table>

      </div>
    </div>
  )
}
