# Fontes de dados

Levantamento feito em 2026-08-04/05. Status pode mudar — revalidar antes de assumir algo aqui como verdade atual.

## Funcionando, usado no v0

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

## Confirmado funcionando, aguardando ação do usuário (cadastro)

### Instituto Fogo Cruzado — violência armada (tiroteios), não roubo/furto

Achado em 2026-08-05 buscando alternativa pra dado street-level de Belém depois que CODEC/SEGUP-PA caíram e scraping de imprensa local esbarrou em bot-detection (ver seção de tentativas sem sucesso abaixo). **Maior banco de dados aberto de violência armada da América Latina**, ONG estabelecida, dado citado por imprensa/academia — não é scraping nosso, é a agregação verificada deles.

- API: `api.fogocruzado.org.br` (docs em `api.fogocruzado.org.br/docs`)
- **Cobre a Região Metropolitana de Belém desde novembro/2023** (também RJ desde 2016, Recife desde 2018, Bahia desde 2022)
- Endpoint `occurrences` retorna, por registro real: `latitude`, `longitude`, `address`, `date`, `state`, `city`, `neighborhood`, `subNeighborhood`, `mainReason`, dados de vítima (idade, gênero, raça, se é agente/civil) — filtrável por `idCities` e intervalo de data (`initialdate`/`finaldate`)
- **Mede coisa diferente de SEGUP-PA/ISP-RJ**: tiroteio/disparo de arma de fogo, não roubo/furto patrimonial. Se entrar no produto, precisa ser camada/metodologia separada — categorias de crime diferentes, não dá pra somar ou misturar no índice de risco atual.
- **Exige cadastro** (email/senha → JWT via `/docs/auth`) pra pegar chave de API. Criar conta em serviço de terceiro é ação do usuário, não do agente (regra de segurança fixa) — usuário vai cadastrar em `fogocruzado.org.br` e passar a chave.
- Próximo passo assim que a chave chegar: desenhar schema novo pra essa camada (provavelmente tabela `armed_violence_events` — evento pontual, não probabilidade agregada, então não reaproveita `incident_patterns` como está), endpoint de API novo, camada visual distinta no mapa (ícone/cor diferente da pulsação de risco atual, pra não confundir as duas fontes/fenômenos).

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

### CODEC (SEGUP-PA)

- `codec.segup.pa.gov.br` — link "Exportar Dados" do portal de transparência aponta pra cá
- Estava com **HTTP 500** em 2026-08-04; em 2026-08-05 o subdomínio inteiro (`sistemas.segup.pa.gov.br`) estava com `ECONNREFUSED` — não dá pra saber se é o mesmo problema piorando ou uma manutenção separada
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
