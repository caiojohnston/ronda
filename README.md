# Ronda

**Status: v0 (MVP funcional local)**

Mapa de risco urbano — mostra onde crimes (roubo/furto) tendem a acontecer, por dia da semana e turno, com base em agregados públicos oficiais. Não é rastreamento em tempo real: é precisão de **localidade**, não de **instante**.

Origem do projeto: usuária assaltada no Ver-o-Peso (Belém) registrou BO e percebeu que o padrão espaço-temporal de crimes é dado público, mesmo sem ocorrência individual em tempo real ser rastreável.

Documentação completa de decisões, dados e roadmap: **[`specs/`](specs/README.md)**.

## Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS + MapLibre GL JS
- **Backend:** Node + TypeScript + Fastify
- **DB:** PostgreSQL nativo (não Docker — ver [`specs/environment-notes.md`](specs/environment-notes.md)). PostGIS fica pra quando precisarmos de busca por raio/proximidade; hoje o schema guarda `lat`/`lng` puros, suficiente pro MVP.

## Funcionalidades (v0)

- Duas cidades: **Belém** (68 bairros reais, contagem oficial CODEC/SEGUP-PA por bairro + turno/dia real, cada um com sua própria distribuição) e **Rio de Janeiro** (41 delegacias distritais, contagem oficial real do ISP-RJ por local, sem eixo temporal — a fonte não publica turno/dia). Seletor de cidade no painel.
- Índice de risco por local; em Belém reativo a dia da semana + turno (modo "Agora" automático ou simulação manual); no Rio, fixo (a UI avisa e desabilita os seletores em vez de fingir uma granularidade que não existe)
- Pontos piscando com tamanho/cor proporcional à intensidade de risco
- Drill-down por clique: probabilidade de roubo/furto separadas + nota de metodologia específica da cidade
- Fórmula 100% baseada em agregados reais (CODEC/SEGUP-PA pra Belém, ISP-RJ pro Rio — nunca números inventados)
- Camada opcional de **ocorrências reais** (Belém): 60.335 registros individuais de roubo/furto (CODEC/SEGUP-PA, jan/2025-ago/2026), clusterizados no mapa — desagrupa com zoom, clique num ponto mostra a ocorrência específica
- Camada opcional de **violência armada** (Belém): 839 tiroteios reais desde nov/2023, dado do Instituto Fogo Cruzado, mostrados como eventos pontuais — fenômeno diferente de roubo/furto, camada separada, desligada por padrão

## Rodando local

Pré-requisito: PostgreSQL instalado e rodando (ver [`specs/environment-notes.md`](specs/environment-notes.md) se for configurar do zero).

```bash
npm install

# criar role/db uma única vez (ajuste senha se usar outra):
# psql -U postgres -c "CREATE ROLE ronda LOGIN PASSWORD 'ronda_dev';"
# psql -U postgres -c "CREATE DATABASE ronda OWNER ronda;"

npm run db:migrate       # cria schema
npm run db:seed          # popula Belém + Rio de Janeiro

cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

npm run dev:api           # http://localhost:4000
npm run dev:web           # http://localhost:5173

# opcional, camada de violência armada (Belém):
# cp .env.example .env  →  preencher com conta criada em fogocruzado.org.br
npm run db:fetch-armed-violence
```

`docker-compose.yml` existe no repo como via alternativa (Postgres+PostGIS em container) mas não é o caminho testado nesta máquina — ver notas de ambiente.

## Metodologia (resumo)

**Belém:** índice = volume real de ocorrências do bairro (relativo ao bairro mais movimentado) × participação real do turno × participação real do dia da semana × participação real do tipo de crime — tudo calculado a partir da distribuição própria daquele bairro específico, vinda de 60.335 ocorrências reais exportadas do **CODEC/SEGUP-PA**.

**Rio de Janeiro:** índice = volume real de BOs da delegacia (roubo+furto, 2025) relativo à mais movimentada do Rio × proporção real roubo/furto observada naquela delegacia. Sem fator de turno/dia — o **ISP-RJ** não publica esse corte, então em vez de inventar uma curva o índice fica fixo, e a UI avisa disso explicitamente.

Detalhes e fórmula exata: [`specs/methodology.md`](specs/methodology.md), `db/seed.js` (Belém) e `db/seed-rio.js` (Rio).

## Próximos passos

Ver [`specs/roadmap.md`](specs/roadmap.md).
