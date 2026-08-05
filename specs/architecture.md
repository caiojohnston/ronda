# Arquitetura

## Stack

| Camada | Escolha | Por quê |
|---|---|---|
| Frontend | React + TypeScript + Vite + Tailwind CSS | Padrão de mercado, DX rápida, tipagem em toda a cadeia |
| Mapa | MapLibre GL JS + tiles OpenFreeMap (`positron`) | Open source, sem API key, sem custo — alternativa ao Mapbox GL JS que cobraria em escala |
| Backend | Node + TypeScript + Fastify | Leve, rápido, boa DX com TS |
| DB access | `pg` direto (queries SQL cruas), sem ORM | Poucas queries, todas simples; ORM seria overhead sem ganho real nesse estágio |
| DB | PostgreSQL nativo | Ver [environment-notes.md](environment-notes.md) — Docker travou nesta máquina |

## Estrutura de pastas

```
novoprojeto/
├── db/
│   ├── schema.sql       # DDL: cities, hotspots, incident_patterns, armed_violence_events, crime_occurrences
│   ├── migrate.js       # roda schema.sql contra DATABASE_URL
│   ├── data/
│   │   └── codec-belem-occurrences.csv  # 60.335 ocorrências reais (CODEC/SEGUP-PA), commitado, sem PII
│   ├── seed.js          # popula Belém a partir do CSV real — índice agregado por bairro
│   ├── seed-rio.js      # popula Rio de Janeiro — dado real ISP-RJ, sem eixo temporal
│   ├── import-crime-occurrences.js  # carrega o mesmo CSV, sem agregar, pra camada de clustering
│   └── fetch-fogo-cruzado.js  # sincroniza armed_violence_events via API do Fogo Cruzado
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── server.ts          # bootstrap Fastify + cors
│   │       ├── db.ts              # pool pg
│   │       ├── lib/turno.ts       # helpers dia/turno (turno a partir da hora)
│   │       └── routes/
│   │           ├── cities.ts              # GET /api/cities
│   │           ├── hotspots.ts            # GET /api/hotspots, GET /api/hotspots/:id
│   │           ├── armed-violence.ts      # GET /api/armed-violence
│   │           └── crime-occurrences.ts   # GET /api/crime-occurrences
│   └── web/
│       └── src/
│           ├── App.tsx                    # estado global: city, day, turno, autoMode, camadas opt-in
│           ├── components/
│           │   ├── MapView.tsx              # MapLibre: markers HTML (risco + violência armada) + GeoJSON clustering (ocorrências)
│           │   ├── TimeControl.tsx          # painel dia/turno/toggle Agora/toggles de camada
│           │   ├── HotspotDetail.tsx        # drawer de drill-down do índice de risco
│           │   ├── ArmedViolenceDetail.tsx  # drawer de detalhe de evento de violência armada
│           │   └── CrimeOccurrenceDetail.tsx # drawer de detalhe de ocorrência individual (CODEC)
│           └── lib/
│               ├── api.ts                 # fetch wrappers
│               └── risk.ts                # cor/tamanho/label por intensidade
├── docker-compose.yml   # Postgres+PostGIS via Docker — existe mas não testado (ver environment-notes)
├── .env                 # gitignored — credenciais Fogo Cruzado, ver .env.example
└── specs/               # esta pasta
```

## Modelo de dados

```sql
cities (id, slug, name, state, center_lat, center_lng, default_zoom, has_temporal_data)
hotspots (id, city_id, name, neighborhood, lat, lng, base_weight)
incident_patterns (id, hotspot_id, day_of_week[0-6], turno[madrugada|manha|tarde|noite], crime_type[roubo|furto], probability[0-1])
armed_violence_events (id, city_id, external_id, occurred_at, lat, lng, neighborhood, address, main_reason, victim_count, death_count, source)
crime_occurrences (id, city_id, crime_type[roubo|furto], bairro, occurred_at, day_of_week[0-6], turno, lat, lng, source)
```

`day_of_week` segue `Date.getDay()` do JS: 0=domingo...6=sábado (escolha deliberada pra casar com `new Date().getDay()` no frontend sem tradução).

## Decisões que vale lembrar

- **Hotspots e violência armada usam markers HTML** (`maplibregl.Marker` com `element` custom), não layer de dados — permite CSS puro pra animação de "pulso" sem `paint` expressions. Ver [environment-notes.md](environment-notes.md) sobre o bug de CSS que isso quase causou. **Ocorrências (CODEC) é a exceção**, desde 2026-08-05: 60k pontos não cabem em DOM markers, então usa GeoJSON source com `cluster: true` nativo do MapLibre — círculos WebGL, não HTML. As duas abordagens coexistem no mesmo mapa (`MapView.tsx`); a consequência é que markers HTML sempre renderizam por cima da camada WebGL, ver [methodology.md](methodology.md#ocorrências-reais-clusterizadas-codec).
- **`intensity` no frontend = `Math.max(roubo_probability, furto_probability)`** — tamanho/cor do marker reflete o pior caso, não a média. Decisão de produto (mostrar o risco mais alto relevante), documentar se mudar.
- **Sem autenticação/admin ainda** — pesos de hotspot só mudam editando `db/seed.js`/`db/seed-rio.js` e rodando `npm run db:seed` de novo (idempotente: apaga e recria hotspots/patterns da cidade).
- **`cities.has_temporal_data`** — liga/desliga o eixo dia/turno por cidade. Belém = true (SEGUP-PA tem o dado real); Rio de Janeiro = false (ISP-RJ só publica agregado mensal, sem turno/dia). Propaga API → frontend (`meta.temporal_data`, `HotspotDetail.temporal_data`) pra `TimeControl` desabilitar os seletores e `HotspotDetail` trocar o rótulo, em vez de fingir uma granularidade que a fonte não tem. Ver [methodology.md](methodology.md#rio-de-janeiro-sem-eixo-temporal).
- **Seletor de cidade** (`TimeControl.tsx`, dropdown) só aparece quando há mais de uma cidade cadastrada — troca de cidade recentraliza o mapa (`MapView` faz `jumpTo` num efeito próprio, disparado por `city.slug`) e fecha o drawer de detalhe aberto.
- **`armed_violence_events` é tabela separada de `incident_patterns`, deliberadamente** — mede um fenômeno diferente (tiroteio/violência armada, evento pontual real) do índice de risco de roubo/furto (probabilidade agregada por dia/turno). Não são somados nem misturados em nenhum cálculo. Visualmente também são diferentes: marcador losango âmbar sem pulso (`.violence-marker` em `index.css`) vs. os círculos pulsantes de risco — decisão deliberada pra não deixar o usuário confundir "aconteceu aqui" com "aqui é estimado como arriscado". Camada é opt-in (toggle desligado por padrão em `TimeControl.tsx`), busca só os últimos 180 dias (`days` em `GET /api/armed-violence`, default no backend) pra manter o mapa legível — ver [methodology.md](methodology.md#violência-armada-fogo-cruzado).
- **Sincronização, não integração ao vivo** — `db/fetch-fogo-cruzado.js` é rodado manualmente (`npm run db:fetch-armed-violence`), não um cron/webhook. Autentica na API do Fogo Cruzado (login por email/senha, token JWT válido 1h), pagina todas as ocorrências de uma cidade e faz upsert por `external_id`. Credenciais em `.env` (gitignored, nunca commitado — ver `.env.example`), carregadas via `node --env-file=.env`, sem dependência de `dotenv`. **Pegadinha:** valores com `#` no `.env` truncam no parser nativo do Node se não estiverem entre aspas (o `#` é lido como início de comentário) — sempre colocar senha/valor com caractere especial entre aspas duplas.
