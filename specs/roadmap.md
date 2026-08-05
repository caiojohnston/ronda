# Roadmap

Ordenado por prioridade sugerida, não por data.

## Dados (o gargalo real)

1. **Protocolar LAI na SEGUP-PA** pedindo dado de logradouro/bairro por ocorrência em Belém (2020-2025) — ver texto sugerido em [data-sources.md](data-sources.md). Prazo legal: 20 dias úteis pra resposta.
2. **Revisitar CODEC** (`codec.segup.pa.gov.br`) periodicamente — estava com HTTP 500, é o link oficial de "Exportar Dados" do próprio portal da SEGUP-PA, provável caminho mais rápido que LAI se voltar ao ar.
3. **Revisitar SINESP/MJSP e Atlas da Violência** — ambos fora do ar durante o levantamento; SINESP seria o caminho pra cobertura nacional (multi-cidade) sem depender de LAI estadual por estado.
4. **Adicionar camada Rio de Janeiro** usando ISP-RJ (já confirmado funcionando, CSV direto por delegacia desde 2003) — é o caminho mais rápido pra provar a arquitetura multi-cidade, independente do resultado do LAI de Belém.

## Produto

- Seletor de cidade na UI (schema já suporta múltiplas cidades via tabela `cities`, falta o componente de troca)
- Clustering/agregação em zoom baixo (nível estado/país) — hoje só existe a visão por hotspot individual
- Explicar melhor a diferença entre "peso heurístico" (Belém, hoje) e "dado oficial por local" (RJ, quando entrar) na própria UI — transparência é o diferencial do produto, não pode ficar só na doc
- Considerar mostrar intervalo de confiança/incerteza junto ao índice, não só um número — reforça a honestidade metodológica

## Técnico

- Autenticação/admin simples pra atualizar `base_weight` e hotspots sem precisar editar `db/seed.js` e rodar migração manual
- Reintroduzir PostGIS quando houver necessidade real de busca por raio (ver [environment-notes.md](environment-notes.md))
- Testes automatizados (hoje zero — v0 foi validado manualmente via browser + scripts de verificação ad-hoc)
- CI básico (typecheck ao menos, já que `tsc --noEmit` está limpo nos dois apps)
- Deploy: ainda não decidido onde hospedar (API + Postgres + frontend estático)

## Não fazer ainda (conscientemente adiado)

- Não adicionar mais cidades até resolver a primeira fonte de dado real (Belém ou RJ) — evitar espalhar heurística em vez de aprofundar dado real
- Não investir em design visual além do funcional até validar que alguém além do criador quer usar isso
