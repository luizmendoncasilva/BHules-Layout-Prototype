# Changelog do Protótipo

Registro simples de ajustes feitos no protótipo (`_proto/frontend`), com data e hora, para acompanhamento das issues.

## 2026-10-13 16:40

- **Sem linha preta em volta dos containers**: o `Card` do design system aplica `border` sem cor, e no Tailwind v4 a cor padrão da borda é a do texto, o que desenhava uma linha preta em volta de todo container (ex.: Tributação por Código de Serviço, Conferência da competência). A linha foi removida num ponto só (`frontend/src/index.css`). Cards com borda colorida de propósito (conferência concluída em verde, alerta de vínculo em amarelo) continuam iguais.

## 2026-10-13 16:18

Sincronização com o frontend oficial (`BHubAI/motor-regras-nfe`, `main` de 13/10). O protótipo partiu do commit `701c861` (23/06); as ~90 mudanças de frontend desde então foram trazidas por merge de 3 vias por arquivo, já no layout do protótipo (tokens e componentes do `@bhubai/bhub-design-system`). Sem commit.

- **Menu**: entraram **NFS-e — Dashboard e Conferência**, **Fila DIFAL-SN** e **Regras DIFAL-SN**. **BHub Tax** saiu do menu (desligado no oficial em 24/09), assim como Diagnóstico Fiscal e Recuperação de Créditos (#716). As views continuam no `App.jsx`.
- **Notas Fiscais (`ListView.jsx`)**: novas abas **Parâmetros da empresa** (tributação por código de serviço, KPIs, Fator R, conferência que libera para o DAS, tracking de origens GDocs/Jettax/Unecont, histórico de alterações) e **Revisões Exportação**. Também entraram a coluna **Situação** (canceladas visíveis), os filtros de coluna consultados no servidor, a busca por destinatário, os filtros Erro Grave e Situação (no painel de filtros acima da tabela), o botão **Revogar precedentes** em lote e o export NFS-e no modelo Unecont. O período padrão passou a ser o mês corrente.
- **Detalhe da nota**: **Ver XML original**, **Revogar precedentes**, **Corrigir aprendizado** em nota já enviada, CST PIS/COFINS na correção, finalidades com rótulo pt-BR, "Motivo do status" lendo as divergências da escrituração.
- **NFS-e**: correção por tributo (vários tributos por nota), precedentes visíveis e revogáveis, IBS/CBS somente leitura, DANFSe com código de verificação.
- **Auditoria**: eventos "Confirmar e Escriturar", "Integrador de Notas" e "Corrigir aprendizado", mantendo o antigo → novo do ajuste de 23/09.
- **Notas Integradas**: agrupamento de NFS-e prestadas por código de serviço.
- **Outros**: busca de empresa por nome fantasia e CNPJ com ou sem máscara, export Excel em Habilitar Clientes, ErrorBoundary global.
- **Mocks**: novos `tributacao.js`, `exportacao.js`, `difal.js`, `precedentes.js` e `nfse.js`. As datas das notas e da auditoria passaram a acompanhar o dia de hoje, para o mês corrente ter dados. O mock agora recebe o corpo dos POSTs, e `fetchWithAuth` também passa pelos mocks.
- **Ficou de fora**: testes (Vitest) e mudanças de backend. O login Microsoft entrou no `LoginPage.jsx`, mas não aparece com o login desligado no protótipo.

## 2026-09-23 09:08

Ajustes pedidos pela Elizandra na call sobre a tela de conferência de notas (Unicont) — referência: `_proto/frontend/src/components/invoices/ListView.jsx` e `BatchAnalysis.jsx`.

- **Filtros no topo da tela**: a linha de filtros por coluna, que ficava dentro do cabeçalho da tabela (`ListView.jsx`), foi movida para um painel próprio logo acima da lista, junto com os demais filtros — não fica mais "dentro" da tabela.
- **Correção em lote de Serviços (NFS-e)**: os campos **Código de Serviço**, **ISS Retido** e **Alíquota ISS** agora são editáveis diretamente na linha, na tela de Resolução em Lote (`BatchAnalysis.jsx`), no mesmo espírito do tratamento que Produtos já tem para CFOP/CST.
- **Auditoria com o que mudou**: o log de auditoria (global e por nota) passou a registrar, além de quem editou, o campo alterado com valor antigo → valor novo (`src/mocks/audit.js`, `AuditLog.jsx`, `AuditTab.jsx`). Antes só registrava a lista de campos alterados, sem os valores.
