# Fontes de dados

Levantamento feito em 2026-08-04/05. Status pode mudar — revalidar antes de assumir algo aqui como verdade atual.

## Funcionando, usado no v0

### CODEC (SEGUP-PA) — ocorrências reais de Belém (camada principal desde 2026-08-05)

CODEC voltou ao ar (estava fora do ar em 2026-08-04/05, ver seção de tentativas abaixo) — resolveu na prática a lacuna que o LAI ia atrás de resolver, antes mesmo de resposta formal. Exportação feita **manualmente pelo usuário** via `codec.segup.pa.gov.br` (sem API pública encontrada — é UI de filtro + export, não um endpoint), filtrado roubo+furto, período 01/01/2025 a 02/08/2026.

- Dado bruto: 2 planilhas .xlsx (61.459 linhas somadas, exportadas em duas faixas de data pelo limite do export), colunas incluindo tipo de crime, bairro, data, dia da semana, hora exata, lat/lng e microdado de vítima/autor (idade, sexo, cor, escolaridade, estado civil — **não importado**, deliberadamente, pra não guardar microdado sensível num produto público)
- Limpeza feita nesta sessão (script Python one-off, não commitado): deduplicação do dia de fronteira entre os dois exports (1.084 linhas duplicadas exatas — os dois arquivos se sobrepunham em 05/01/2026), remoção de 38 linhas com erro de geocodificação da própria fonte (coordenadas caindo em SP/RJ/outros estados — erro do CODEC, não nosso), turno derivado da hora (mesma convenção do resto do produto: madrugada/manhã/tarde/noite = blocos de 6h)
- Resultado: **60.335 ocorrências limpas**, commitadas em `db/data/codec-belem-occurrences.csv` (4.1MB), 68 bairros reais distintos, furto 41.005 / roubo 19.330
- Uso: fonte única tanto do índice de risco agregado por bairro (`db/seed.js`, substituiu a heurística de 20 landmarks — ver [methodology.md](methodology.md)) quanto da camada de pontos clusterizados no mapa (`db/import-crime-occurrences.js` → tabela `crime_occurrences`, endpoint `/api/crime-occurrences`)
- **Reabre o item "revisitar CODEC" do roadmap como resolvido** — LAI/MPPA continuam válidos pra ampliar período histórico (o CODEC só foi filtrado 2025 em diante) ou como redundância caso o portal caia de novo.

### ISP-RJ — BaseDPEvolucaoMensalCisp.csv (camada Rio de Janeiro, 2026-08-05)

- Download direto, sem login: `www.ispdados.rj.gov.br/Arquivos/BaseDPEvolucaoMensalCisp.csv` (6.9MB, baixado e inspecionado linha a linha nesta sessão — não é resumo de terceiros)
- Granularidade: **mensal por delegacia (CISP)**, desde 01/2003 até meses de 2026. Colunas confirmadas por leitura direta do header: `cisp;mes;ano;...;total_roubos;...;total_furtos;...`
- **Não tem turno nem dia da semana** — só `mes`/`ano`. Isso é uma limitação real da fonte, não do produto: diferente da SEGUP-PA, o ISP-RJ nunca publicou esse corte. Ver decisão em [methodology.md](methodology.md#rio-de-janeiro-sem-eixo-temporal).
- Usado no v0: soma de `total_roubos`/`total_furtos` do ano-calendário 2025 completo (12 meses), filtrado `munic == "Rio de Janeiro"` (41 CISPs distintas em 2025) — embutido em `db/seed-rio.js`.
- **Ressalva de subnotificação:** contagem depende de BO registrado; áreas de forte presença de facção/milícia tendem a ter menos BOs por desconfiança no sistema formal, não porque sejam mais seguras. Observado no dado real: 11ª DP (Rocinha) aparece com apenas 8 roubos/136 furtos em 2025 — ordem de grandeza muito abaixo de delegacias vizinhas de perfil socioeconômico parecido. Não corrigimos isso (não há como, sem outra fonte) — é uma limitação conhecida de dado de BO em qualquer país, documentada aqui pra não ser lida como "Rocinha é a área mais segura do Rio".

### Coordenadas das delegacias (camada Rio de Janeiro)

- Fonte: camada oficial **"Delegacias de Polícia Civil do Estado do Rio de Janeiro"**, publicada por PCERJ, republicada pelo Núcleo de Ciência de Dados do MPRJ (coleta jul/2025)
- Acesso: ArcGIS MapServer público, sem chave — `geo.mprj.mp.br/arcgis/rest/services/Seguranca_Publica/Delegacias_de_Polícia_Civil_do_Estado_do_Rio_de_Janeiro/MapServer/0/query`
- Campos usados: `cisp` (chave de junção com o CSV do ISP-RJ acima), `delegacia`, `municipio`, `categoria`, `latitude`, `longitude`
- Filtro aplicado: `municipio = 'Rio de Janeiro'` AND `categoria = 'Capital'` (exclui unidades especializadas — DEAM, Polícia Técnica, Homicídios etc. — que têm jurisdição sobreposta e poluiriam o mapa de delegacias distritais) → 41 registros, batendo exatamente com as 41 CISPs do CSV de crime em 2025
- **Coordenada real da sede da delegacia, não do endereço de cada ocorrência** — mesma limitação de granularidade espacial que Belém tem (ponto único representando uma área), só que aqui a fronteira é a jurisdição oficial da CISP, não um heurístico nosso

### SEGUP-PA — Portal da Transparência (Power BI)

- Portal: `sistemas.segup.pa.gov.br/transparencia/` → menu → Estatísticas → Dashboard
- Embed real: Power BI público em `app.powerbi.com/view?r=...`. **Nota 2026-08-05:** a doc antiga dizia que a URL completa estava salva em `db/seed.js` — na prática não está (só o comentário com os números finais, sem a URL do embed). `sistemas.segup.pa.gov.br` inteiro está fora do ar agora (ver seção de tentativas abaixo), então não deu pra recapturar a URL nesta sessão. Se for reabrir essa fonte, precisa renavegar o portal do zero.
- Páginas relevantes: "ROUBO - FURTO" e "OCORRÊNCIAS" (turno + dia da semana)
- Dados confirmados, atualizados (dashboard mostrava atualização do dia anterior no momento do teste)
- Filtrável por município — Belém isolável clicando na tabela "Municípios"
- Exportável: botão direito no gráfico → "Show as a table" mostra os dados brutos por trás do gráfico
- **É a fonte real por trás de `TURNO_SHARE`, `DAY_SHARE`, `CRIME_SHARE` em `db/seed.js`**

Números capturados (Pará, agregado, todos os municípios):
- Turno: manhã 32.03%, tarde 29.89%, noite 27.32%, madrugada 10.76%
- Dia da semana: seg 15.5%, sex 14.63%, qua 14.54%, ter 14.36%, qui 14.13%, dom 13.75%, sáb 13.03%
- Crime: roubo 53.85%, furto 46.15% (Belém: roubo 661.765 / furto 567.071)

## Funcionando, usado no v0 (continuação)

### Instituto Fogo Cruzado — violência armada (tiroteios), não roubo/furto

Achado em 2026-08-05 buscando alternativa pra dado street-level de Belém depois que CODEC/SEGUP-PA caíram e scraping de imprensa local esbarrou em bot-detection (ver seção de tentativas sem sucesso abaixo). **Maior banco de dados aberto de violência armada da América Latina**, ONG estabelecida, dado citado por imprensa/academia — não é scraping nosso, é a agregação verificada deles. Integrado no mesmo dia, depois do usuário criar conta e passar a chave.

- **Host real da API é `api-service.fogocruzado.org.br`**, não `api.fogocruzado.org.br` (esse é só o site de documentação — `api.fogocruzado.org.br/docs` mostra os exemplos, mas as chamadas de verdade vão pro `api-service`)
- Login: `POST /api/v2/auth/login` com `{email, password}` → `{data: {accessToken, expiresIn: 3600}}` (JWT, válido 1h, sem refresh automático — script atual só faz um login e roda até terminar, não precisa renovar pro volume atual)
- Cidades: `GET /api/v2/cities?take=500` → lista com `{id, name, state: {id, name}}`. Belém: `id=b5fb1bfa-8d75-4e41-a3e6-84392b5410f7`, estado Pará `id=2a98a020-3815-45d7-a6f6-6de2119eba8b` (não hardcoded no script — ele busca pelo nome "Belém" toda vez, mais robusto que fixar o UUID)
- Ocorrências: `GET /api/v2/occurrences?idState=...&idCities=...&take=100&page=N` — **`idState` é obrigatório**, não documentado como tal no `/docs` (erro só aparece em runtime: `"idState should not be empty"`). `take` máximo testado: 100. Resposta paginada via `pageMeta.hasNextPage`.
- **Belém: 839 ocorrências desde novembro/2023** (confirmado via API em 2026-08-05), ritmo de ~20/mês, 120 nos últimos 180 dias — volume viável pra mostrar como pontos individuais no mapa sem clustering, ao contrário do que seria mostrar tudo de uma vez.
- Campos usados: `latitude`, `longitude`, `date`, `neighborhood.name`, `address`, `contextInfo.mainReason.name`, `victims[]` (contamos `victims.length` como `victim_count` e `victims.filter(v => v.situation === 'Dead').length` como `death_count`)
- **Cobre RJ, Recife e Bahia também**, além de Belém — dá pra estender a mesma camada pro Rio rodando `fetch-fogo-cruzado.js` com a cidade certa (script hoje hardcoded pra `CITY_NAME_FC = "Belém"`), não feito ainda.
- Credenciais em `.env` (gitignored) — cadastro é ação do usuário (regra de segurança do agente: nunca criar conta em serviço de terceiro). **Pegadinha real encontrada:** senha continha `#`, que o parser `--env-file` nativo do Node trata como início de comentário fora de aspas — truncou a senha silenciosamente (`8#bKu1T;...` virou só `8`), causando 401 até perceber e colocar a senha entre aspas duplas no `.env`.

## Tentativas sem sucesso nesta sessão (2026-08-05)

- **`sistemas.segup.pa.gov.br`** (dashboard + CODEC) — domínio inteiro fora do ar (`ECONNREFUSED`), não só o CODEC que já sabíamos que estava 500. Domínio raiz `segup.pa.gov.br` responde normal — parece instabilidade pontual do subdomínio, revisitar.
- **Geoportal do MPPA** (esperava achar algo tipo `geo.mprj.mp.br`, que resolveu as coordenadas do RJ) — `geo.mppa.mp.br` não existe. MPPA tem, sim, um canal formal: Centro de Apoio Operacional Criminal, BI próprio com dado por município, contato `caocriminal@mppa.mp.br` — não explorado ainda, é pedido formal como o LAI.
- **Scraping Diário do Pará** (`diariodopara.com.br/policia/`) — `robots.txt` bloqueia explicitamente `ClaudeBot`/`anthropic-ai` (`Disallow: /`). Não contornado, por princípio — o site declarou que não quer bots da Anthropic.
- **Scraping O Liberal** (`oliberal.com/policia/`) — `robots.txt` não bloqueia, mas a seção retorna **HTTP 403 com desafio reCAPTCHA ativo** (proteção GoCache). Contornar CAPTCHA é ação que não faço por princípio, independente do que o robots.txt permite. Via morta pra automação.
- **TJPA** (consulta processual) — sem caminho de acesso em massa; consulta é caso a caso, e processos de inquérito costumam ser sigilosos. Não é fonte viável pra volume.

## Fora do ar durante o levantamento (revalidar)

### SINESP / MJSP

- `dados.mj.gov.br` (API CKAN) — 4 tentativas, timeout
- Seria a fonte pra cobertura **nacional** (todas as cidades) — importante revisitar

### Atlas da Violência (IPEA/FBSP)

- `ipea.gov.br/atlasviolencia/api/v1/*` — retornando 404
- Teria homicídios/violência por município histórico

### dados.gov.br (portal CKAN geral)

- Exige `DADOS_GOV_BR_API_KEY` que não estava configurada no mcp-brasil usado na pesquisa

### CODEC (SEGUP-PA) — RESOLVIDO em 2026-08-05

Estava com HTTP 500 (2026-08-04) e depois `ECONNREFUSED` no subdomínio inteiro (2026-08-05, mesmo dia, sessão anterior) — voltou ao ar ainda em 2026-08-05, usuário exportou manualmente. Ver seção "Funcionando, usado no v0" acima.

## Ampliação futura (opcional — não bloqueante)

### Período histórico maior que jan/2025 em Belém

CODEC resolveu o problema estrutural (dado por bairro/lat-lng existe e é acessível), mas o export atual só cobre jan/2025-ago/2026. Se quiser cobertura histórica maior (ex.: 2020-2024), os caminhos que já estavam em andamento continuam válidos como ampliação, não mais como bloqueio:
1. Reexportar do CODEC com período maior, se o portal permitir
2. **LAI (Lei de Acesso à Informação)** junto à SEGUP-PA via `falabr.cgu.gov.br` — texto pronto em conversa anterior, ainda não protocolado
3. **MPPA/CAO Criminal** (`caocriminal@mppa.mp.br`) — canal paralelo, ainda não enviado

## Ferramenta usada na pesquisa

MCP `mcp-brasil` (54 features ativas: SINESP, Atlas da Violência, Fórum Brasileiro de Segurança Pública, IBGE, etc.) — útil pra descoberta inicial, mas a maioria das fontes de segurança pública especificamente estava fora do ar no momento do teste. O achado real (dashboard Power BI da SEGUP-PA) veio de navegação manual no browser, não do MCP.
