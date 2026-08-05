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

- Mapa de Belém com 20 hotspots reais (Ver-o-Peso, Jurunas, Guamá, Comércio, etc.)
- Índice de risco por local, reativo a dia da semana + turno, com modo "Agora" (automático) e simulação manual
- Pontos piscando com tamanho/cor proporcional à intensidade de risco
- Drill-down por clique: probabilidade de roubo/furto separadas + nota de metodologia
- Fórmula 100% baseada em agregados reais da SEGUP-PA (não são números inventados)

## Rodando local

Pré-requisito: PostgreSQL instalado e rodando (ver [`specs/environment-notes.md`](specs/environment-notes.md) se for configurar do zero).

```bash
npm install

# criar role/db uma única vez (ajuste senha se usar outra):
# psql -U postgres -c "CREATE ROLE ronda LOGIN PASSWORD 'ronda_dev';"
# psql -U postgres -c "CREATE DATABASE ronda OWNER ronda;"

npm run db:migrate       # cria schema
npm run db:seed          # popula Belém com hotspots + padrões

cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

npm run dev:api           # http://localhost:4000
npm run dev:web           # http://localhost:5173
```

`docker-compose.yml` existe no repo como via alternativa (Postgres+PostGIS em container) mas não é o caminho testado nesta máquina — ver notas de ambiente.

## Metodologia (resumo)

Índice de risco por ponto = peso heurístico do local (fluxo público/densidade comercial) × participação real do turno × participação real do dia da semana × participação real do tipo de crime (roubo/furto).

Turno e dia da semana vêm de agregados reais do **Portal da Transparência da SEGUP-PA** (dashboard Power BI). O peso por hotspot é uma estimativa heurística — ainda não temos dado oficial por endereço/logradouro. Detalhes e fórmula exata: [`specs/methodology.md`](specs/methodology.md) e `db/seed.js`.

## Próximos passos

Ver [`specs/roadmap.md`](specs/roadmap.md).
