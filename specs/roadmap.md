# Roadmap

Ordenado por prioridade sugerida, não por data.

## Dados (o gargalo real)

1. **Protocolar LAI na SEGUP-PA** pedindo dado de logradouro/bairro por ocorrência em Belém (2020-2025) — ver texto sugerido em [data-sources.md](data-sources.md). Prazo legal: 20 dias úteis pra resposta. Ainda não protocolado — é ação do usuário, não automatizável.
2. **Revisitar CODEC** (`codec.segup.pa.gov.br`) periodicamente — estava com HTTP 500, é o link oficial de "Exportar Dados" do próprio portal da SEGUP-PA, provável caminho mais rápido que LAI se voltar ao ar.
3. **Revisitar SINESP/MJSP e Atlas da Violência** — ambos fora do ar durante o levantamento; SINESP seria o caminho pra cobertura nacional (multi-cidade) sem depender de LAI estadual por estado.
4. ~~Adicionar camada Rio de Janeiro~~ — **feito em 2026-08-05**: 41 delegacias distritais da capital, dado real ISP-RJ 2025 (contagem por CISP) + coordenadas oficiais PCERJ/MPRJ. Ver [data-sources.md](data-sources.md) e [methodology.md](methodology.md#rio-de-janeiro-sem-eixo-temporal). Achado importante: ISP-RJ não tem turno/dia da semana — decisão tomada com o usuário foi deixar o índice do RJ sem variação temporal em vez de inventar uma curva.
5. **Buscar fonte de turno/dia da semana pro Rio** — se aparecer (ex.: ISP Conecta/ispvisualizacao.rj.gov.br pode ter granularidade que o CSV bulk não tem, não confirmado ainda), dá pra ligar `has_temporal_data = true` pro RJ sem mudar schema.

## Produto

- ~~Seletor de cidade na UI~~ — **feito em 2026-08-05**, dropdown em `TimeControl.tsx`, só aparece com 2+ cidades cadastradas.
- Clustering/agregação em zoom baixo (nível estado/país) — hoje só existe a visão por hotspot individual. Fica mais relevante agora que RJ tem 41 pontos espalhados por uma área bem maior que Belém.
- ~~Explicar diferença entre peso heurístico e dado oficial na UI~~ — parcialmente feito: nota de metodologia no drill-down já é por cidade e explica a fonte; falta um indicador visual mais direto no mapa (ex. badge "dado oficial" vs "estimativa") sem precisar clicar no ponto.
- Considerar mostrar intervalo de confiança/incerteza junto ao índice, não só um número — reforça a honestidade metodológica. Ficou mais tangível com RJ: delegacias de baixíssimo volume (ex. Rocinha, provável subnotificação — ver [data-sources.md](data-sources.md)) deveriam comunicar "dado inconclusivo", não "risco baixo".

## Técnico

- Autenticação/admin simples pra atualizar `base_weight` e hotspots sem precisar editar `db/seed.js` e rodar migração manual
- Reintroduzir PostGIS quando houver necessidade real de busca por raio (ver [environment-notes.md](environment-notes.md))
- Testes automatizados (hoje zero — v0 foi validado manualmente via browser + scripts de verificação ad-hoc)
- CI básico (typecheck ao menos, já que `tsc --noEmit` está limpo nos dois apps)
- Deploy: ainda não decidido onde hospedar (API + Postgres + frontend estático)

## Não fazer ainda (conscientemente adiado)

- Não adicionar uma 3ª cidade até validar que a 2ª (RJ) realmente prova a arquitetura em uso real — evitar espalhar fino em vez de aprofundar
- Não investir em design visual além do funcional até validar que alguém além do criador quer usar isso
