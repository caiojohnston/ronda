# Fontes de dados

Levantamento feito em 2026-08-04/05. Status pode mudar — revalidar antes de assumir algo aqui como verdade atual.

## Funcionando, usado no v0

### SEGUP-PA — Portal da Transparência (Power BI)

- Portal: `sistemas.segup.pa.gov.br/transparencia/` → menu → Estatísticas → Dashboard
- Embed real: Power BI público em `app.powerbi.com/view?r=...` (URL completa em `db/seed.js`, comentário no topo)
- Páginas relevantes: "ROUBO - FURTO" e "OCORRÊNCIAS" (turno + dia da semana)
- Dados confirmados, atualizados (dashboard mostrava atualização do dia anterior no momento do teste)
- Filtrável por município — Belém isolável clicando na tabela "Municípios"
- Exportável: botão direito no gráfico → "Show as a table" mostra os dados brutos por trás do gráfico
- **É a fonte real por trás de `TURNO_SHARE`, `DAY_SHARE`, `CRIME_SHARE` em `db/seed.js`**

Números capturados (Pará, agregado, todos os municípios):
- Turno: manhã 32.03%, tarde 29.89%, noite 27.32%, madrugada 10.76%
- Dia da semana: seg 15.5%, sex 14.63%, qua 14.54%, ter 14.36%, qui 14.13%, dom 13.75%, sáb 13.03%
- Crime: roubo 53.85%, furto 46.15% (Belém: roubo 661.765 / furto 567.071)

## Confirmado funcionando, não usado ainda

### ISP-RJ (Instituto de Segurança Pública do Rio de Janeiro)

- `ispdados.rj.gov.br` — CSVs de download direto, sem login
- `BaseMunicipioMensal.csv` (2.3MB, por município, desde 2014)
- `BaseDPEvolucaoMensalCisp.csv` (6.6MB, **por delegacia**, desde 2003)
- Colunas incluem `roubo_transeunte`, `roubo_celular`, `furto_veiculos`, `total_roubos`, `total_furtos`, `latrocinio`, `hom_doloso`
- **Padrão-ouro brasileiro de dados abertos de segurança** — caminho mais rápido pra adicionar uma cidade nova (RJ)

## Fora do ar durante o levantamento (revalidar)

### SINESP / MJSP

- `dados.mj.gov.br` (API CKAN) — 4 tentativas, timeout
- Seria a fonte pra cobertura **nacional** (todas as cidades) — importante revisitar

### Atlas da Violência (IPEA/FBSP)

- `ipea.gov.br/atlasviolencia/api/v1/*` — retornando 404
- Teria homicídios/violência por município histórico

### dados.gov.br (portal CKAN geral)

- Exige `DADOS_GOV_BR_API_KEY` que não estava configurada no mcp-brasil usado na pesquisa

### CODEC (SEGUP-PA)

- `codec.segup.pa.gov.br` — link "Exportar Dados" do portal de transparência aponta pra cá
- Retornou **HTTP 500** durante o teste
- **Provável caminho real pra dado em nível de logradouro/bairro** — vale revisitar periodicamente

## Não obtido — requer ação formal

### Dado por endereço/logradouro em Belém

Não existe publicamente em bulk. Caminhos:
1. CODEC voltar do ar (grátis, mas incerto)
2. **LAI (Lei de Acesso à Informação)** junto à SEGUP-PA via `falabr.cgu.gov.br` — não protocolado ainda. Pedido sugerido:
   > "Dados de boletins de ocorrência registrados no município de Belém, período 2020-2025, contendo: tipo de crime, logradouro, bairro, data e hora da ocorrência."
   Prazo legal de resposta: 20 dias úteis.

Até um desses caminhos se resolver, os 20 hotspots do v0 usam coordenadas de landmarks conhecidos (Ver-o-Peso, Comércio, Jurunas, etc.) com peso heurístico — **não é dado oficial por endereço**, isso está documentado na própria UI (nota de metodologia) e não deve ser apresentado como mais preciso do que é.

## Ferramenta usada na pesquisa

MCP `mcp-brasil` (54 features ativas: SINESP, Atlas da Violência, Fórum Brasileiro de Segurança Pública, IBGE, etc.) — útil pra descoberta inicial, mas a maioria das fontes de segurança pública especificamente estava fora do ar no momento do teste. O achado real (dashboard Power BI da SEGUP-PA) veio de navegação manual no browser, não do MCP.
