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
│   ├── schema.sql       # DDL: cities, hotspots, incident_patterns
│   ├── migrate.js       # roda schema.sql contra DATABASE_URL
│   └── seed.js          # popula Belém — fórmula do índice de risco mora aqui
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── server.ts          # bootstrap Fastify + cors
│   │       ├── db.ts              # pool pg
│   │       ├── lib/turno.ts       # helpers dia/turno (turno a partir da hora)
│   │       └── routes/
│   │           ├── cities.ts      # GET /api/cities
│   │           └── hotspots.ts    # GET /api/hotspots, GET /api/hotspots/:id
│   └── web/
│       └── src/
│           ├── App.tsx                    # estado global: city, day, turno, autoMode
│           ├── components/
│           │   ├── MapView.tsx            # MapLibre + markers HTML animados
│           │   ├── TimeControl.tsx        # painel dia/turno/toggle Agora
│           │   └── HotspotDetail.tsx      # drawer de drill-down
│           └── lib/
│               ├── api.ts                 # fetch wrappers
│               └── risk.ts                # cor/tamanho/label por intensidade
├── docker-compose.yml   # Postgres+PostGIS via Docker — existe mas não testado (ver environment-notes)
└── specs/               # esta pasta
```

## Modelo de dados

```sql
cities (id, slug, name, state, center_lat, center_lng, default_zoom)
hotspots (id, city_id, name, neighborhood, lat, lng, base_weight)
incident_patterns (id, hotspot_id, day_of_week[0-6], turno[madrugada|manha|tarde|noite], crime_type[roubo|furto], probability[0-1])
```

`day_of_week` segue `Date.getDay()` do JS: 0=domingo...6=sábado (escolha deliberada pra casar com `new Date().getDay()` no frontend sem tradução).

## Decisões que vale lembrar

- **Sem GeoJSON clustering nativo do MapLibre** — markers são elementos HTML (`maplibregl.Marker` com `element` custom), não uma layer de dados. Escolha deliberada: permite CSS puro pra animação de "pulso" sem lidar com `paint` expressions do MapLibre. Ver [environment-notes.md](environment-notes.md) sobre o bug de CSS que isso quase causou.
- **`intensity` no frontend = `Math.max(roubo_probability, furto_probability)`** — tamanho/cor do marker reflete o pior caso, não a média. Decisão de produto (mostrar o risco mais alto relevante), documentar se mudar.
- **Sem autenticação/admin ainda** — pesos de hotspot só mudam editando `db/seed.js` e rodando `npm run db:seed` de novo (idempotente: apaga e recria hotspots/patterns da cidade).
