# Roadmap

Ordenado por prioridade sugerida, não por data.

## Dados (o gargalo real)

1. ~~Protocolar LAI na SEGUP-PA~~ — **superado em 2026-08-05**: CODEC voltou ao ar antes da resposta formal, usuário exportou 60.335 ocorrências reais direto (jan/2025-ago/2026, roubo+furto, Belém). LAI/MPPA viram baixa prioridade — só valem a pena se quiser ampliar o período histórico (ver [data-sources.md](data-sources.md)), não são mais bloqueio.
2. ~~Revisitar CODEC~~ — **feito em 2026-08-05**: portal voltou, usuário exportou manualmente. Virou a fonte real de `db/seed.js` (índice agregado por bairro) e da nova camada `crime_occurrences` (pontos clusterizados). Ver [data-sources.md](data-sources.md) e [methodology.md](methodology.md).
3. **Revisitar SINESP/MJSP e Atlas da Violência** — ambos fora do ar durante o levantamento; SINESP seria o caminho pra cobertura nacional (multi-cidade) sem depender de LAI estadual por estado.
4. ~~Adicionar camada Rio de Janeiro~~ — **feito em 2026-08-05**: 41 delegacias distritais da capital, dado real ISP-RJ 2025 (contagem por CISP) + coordenadas oficiais PCERJ/MPRJ. Ver [data-sources.md](data-sources.md) e [methodology.md](methodology.md#rio-de-janeiro-sem-eixo-temporal). Achado importante: ISP-RJ não tem turno/dia da semana — decisão tomada com o usuário foi deixar o índice do RJ sem variação temporal em vez de inventar uma curva.
5. **Buscar fonte de turno/dia da semana pro Rio** — se aparecer (ex.: ISP Conecta/ispvisualizacao.rj.gov.br pode ter granularidade que o CSV bulk não tem, não confirmado ainda), dá pra ligar `has_temporal_data = true` pro RJ sem mudar schema.
6. ~~Integrar API do Fogo Cruzado~~ — **feito em 2026-08-05**: tabela `armed_violence_events`, `db/fetch-fogo-cruzado.js` (sync manual via `npm run db:fetch-armed-violence`), endpoint `GET /api/armed-violence`, camada opt-in no mapa (losango âmbar, sem pulso) com drawer próprio. 839 eventos reais em Belém desde nov/2023, mostrando os últimos 180 dias (120 eventos) por padrão. Ver [data-sources.md](data-sources.md) e [methodology.md](methodology.md#violência-armada-fogo-cruzado).
7. **Estender Fogo Cruzado pro Rio de Janeiro** — a API já cobre RJ (desde 2016, é a cidade histórica do projeto). `db/fetch-fogo-cruzado.js` está hardcoded pra buscar só "Belém" (`CITY_NAME_FC`) — generalizar pra rodar por qualquer cidade cadastrada, ou pelo menos aceitar um segundo argumento.
8. **Sincronização periódica do Fogo Cruzado** — hoje é rodada manual (`npm run db:fetch-armed-violence`). Não existe infra de cron/scheduled job no projeto ainda; dado fica parado até alguém rodar de novo. Baixa prioridade pro tamanho atual do produto, mas cresce como problema se o mapa "envelhecer" visivelmente.
9. **Pedido formal ao MPPA (CAO Criminal, `caocriminal@mppa.mp.br`)** — canal paralelo, baixa prioridade desde que CODEC resolveu o essencial (item 1). Só vale a pena se quiser ampliar período histórico. Ainda não redigido/enviado.

## Produto

- ~~Seletor de cidade na UI~~ — **feito em 2026-08-05**, dropdown em `TimeControl.tsx`, só aparece com 2+ cidades cadastradas.
- ~~Clustering/agregação em zoom baixo~~ — **feito em 2026-08-05, mas só pra camada de ocorrências (CODEC)**: `crime_occurrences` usa clustering nativo do MapLibre (60k pontos, desagrupa com zoom). Os hotspots do índice de risco (bolhas pulsantes) continuam sem clustering — RJ ainda tem 41 pontos individuais sem agrupar, Belém 68. Baixa prioridade agora (68/41 é gerenciável sem cluster), mas revisitar se o RJ ganhar uma camada de ocorrências brutas tipo a de Belém.
- ~~Explicar diferença entre peso heurístico e dado oficial na UI~~ — parcialmente feito: nota de metodologia no drill-down já é por cidade e explica a fonte; falta um indicador visual mais direto no mapa (ex. badge "dado oficial" vs "estimativa") sem precisar clicar no ponto.
- Considerar mostrar intervalo de confiança/incerteza junto ao índice, não só um número — reforça a honestidade metodológica. Ficou mais tangível com RJ: delegacias de baixíssimo volume (ex. Rocinha, provável subnotificação — ver [data-sources.md](data-sources.md)) deveriam comunicar "dado inconclusivo", não "risco baixo".

## Técnico

- Autenticação/admin simples pra atualizar `base_weight` e hotspots sem precisar editar `db/seed.js` e rodar migração manual
- Reintroduzir PostGIS quando houver necessidade real de busca por raio (ver [environment-notes.md](environment-notes.md))
- Testes automatizados (hoje zero — v0 foi validado manualmente via browser + scripts de verificação ad-hoc)
- CI básico (typecheck ao menos, já que `tsc --noEmit` está limpo nos dois apps)
- Deploy: plano escrito em [deploy.md](deploy.md) (frontend na Vercel, API+Postgres em Railway/Render — ainda não executado, falta escolher host da API/DB e rodar)

## Não fazer ainda (conscientemente adiado)

- Não adicionar uma 3ª cidade até validar que a 2ª (RJ) realmente prova a arquitetura em uso real — evitar espalhar fino em vez de aprofundar
- Não investir em design visual além do funcional até validar que alguém além do criador quer usar isso
