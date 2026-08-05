# Deploy — planejamento (não executado ainda)

Este documento é um plano, não um deploy feito. Nada aqui foi executado — decisões marcadas
"a confirmar" precisam de escolha do usuário antes de agir (conta em serviço externo, cartão,
domínio).

## Decisão de arquitetura: Vercel só pro frontend

Vercel é excelente pra apps estáticos/Vite (é literalmente o caso de uso principal deles), mas
**não é um bom lugar pra rodar Fastify + Postgres**:

- Vercel roda código como funções serverless (sem estado, sem processo longo). Fastify dá pra
  adaptar (existe padrão: `export default async (req,res) => { await app.ready(); app.server.emit('request', req, res); }`),
  mas cada invocação fria reabre conexão com o Postgres — sem um pooler (PgBouncer, ou o pooler
  embutido do Neon), 60k+ ocorrências servidas em rajada de requests esgota `max_connections` do
  Postgres rápido.
- Vercel não hospeda Postgres com estado persistente nativamente pra uma app fora do ecossistema
  Next.js — "Vercel Postgres" existe mas é Neon por trás, seria mais um serviço externo com
  roupagem Vercel, não um ganho real de simplicidade aqui.

**Plano: frontend (`apps/web`) na Vercel, API (`apps/api`) + Postgres num host que roda processo
Node contínuo.** Isso evita reescrever `server.ts`/rotas Fastify em formato serverless — zero
mudança de código no backend, só variáveis de ambiente.

**Host recomendado pra API+DB: Railway.** Por quê: Postgres gerenciado + deploy de app Node a
partir do repo em poucos cliques, free tier cobre esse estágio do projeto, sem cartão obrigatório
pra começar. Alternativas equivalentes: Render (Postgres+Web Service, tier free "spin down" mais
agressivo) ou Fly.io (mais controle, mais configuração manual — `fly.toml`, volumes). Escolha
final é do usuário; o plano abaixo assume Railway mas os passos são quase idênticos nos três.

## Passo a passo

### 1. Provisionar Postgres

- Criar Postgres gerenciado (Railway/Render/Neon — **a confirmar qual**)
- Pegar a `DATABASE_URL` de produção
- Rodar contra ela, a partir da máquina local (ou de um shell temporário do provedor):
  ```bash
  DATABASE_URL=<url-de-produção> node db/migrate.js
  DATABASE_URL=<url-de-produção> npm run db:seed
  ```
  `db:seed` já roda `seed.js` (Belém, real CODEC) + `seed-rio.js` (RJ) + `import-crime-occurrences.js`
  (60k pontos) em sequência — vai demorar mais que local por causa da latência de rede até o
  Postgres remoto, mas é rodada única, não recorrente.
- Opcional: `db:fetch-armed-violence` (Fogo Cruzado) contra a mesma `DATABASE_URL`, se quiser a
  camada de violência armada populada em produção — precisa de `FOGOCRUZADO_EMAIL`/`_PASSWORD` no
  ambiente de quem roda o comando (não fica na API, só nesse script pontual).

### 2. Deploy da API (Railway ou equivalente)

- Apontar o serviço pra pasta `apps/api` do monorepo (Railway/Render suportam "root directory" em
  monorepo — configurar isso, senão ele tenta rodar da raiz)
- Build: `npm install && npm run build` (roda `tsc`, gera `dist/`)
- Start: `npm start` (`node dist/server.js`, já existe em `apps/api/package.json`)
- Variáveis de ambiente no serviço:
  - `DATABASE_URL` — a mesma do passo 1
  - `PORT` — geralmente o provedor injeta a própria, `server.ts` já lê `process.env.PORT` com
    fallback pra 4000, não precisa mexer
  - `CORS_ORIGIN` — **domínio final da Vercel** (ex.: `https://ronda.vercel.app`), não deixar em
    branco. O regex `/^http:\/\/localhost:\d+$/` que virou fallback em `server.ts` é só pra dev
    local — em produção, `CORS_ORIGIN` sempre vem setada explicitamente e o regex nunca entra em
    jogo (confirmar isso no código antes de subir, é comportamento esperado, não bug)
- Depois do deploy: bater no health check (`GET /health` → `{ok:true}`) e em `/api/cities` pra
  confirmar que a API enxerga o Postgres de produção

### 3. Deploy do frontend (Vercel)

- Criar projeto Vercel apontando pro repo, **root directory = `apps/web`**
- Framework preset: Vite (Vercel detecta sozinho)
- Build command: `npm run build` (roda `tsc -b && vite build`)
- Output directory: `dist` (padrão Vite, não precisa configurar)
- Variável de ambiente: `VITE_API_URL` = URL pública da API (do passo 2)
- Sem rotas client-side (`App.tsx` não usa React Router, é single-view) — não precisa de rewrite
  rule tipo SPA fallback no `vercel.json`

### 4. Validação pós-deploy

- Abrir o domínio da Vercel, confirmar que `/api/cities` carrega sem erro de CORS (esse foi o bug
  que apareceu em dev quando a porta mudou — mesma classe de erro pode aparecer em prod se
  `CORS_ORIGIN` estiver errado)
- Trocar cidade Belém↔RJ, confirmar mapa recentraliza
- Ligar camada de ocorrências (CODEC), confirmar cluster carrega (60k pontos — primeira carga vai
  ser mais lenta que local, medir tempo real e decidir se precisa paginar/limitar no futuro)
- Testar os filtros (data, bairro, turno, tipo)

## Em aberto — decisão do usuário

- **Qual host pra API+DB** (Railway vs Render vs Fly.io vs outro) — recomendação é Railway, não
  decidido
- **Domínio próprio ou subdomínio `*.vercel.app`** — nada configurado ainda
- **Sincronização do Fogo Cruzado em produção**: hoje é rodada manual local (`npm run
  db:fetch-armed-violence`). Se for manter atualizado em prod, precisa rodar esse comando
  periodicamente contra a `DATABASE_URL` de produção — não existe cron configurado (ver
  [roadmap.md](roadmap.md), item "sincronização periódica")
- **Custo**: free tier deve cobrir o estágio atual do projeto (baixo tráfego, 1 usuário). Revisar
  se/quando o uso crescer — Postgres com 60k+ linhas ainda é pequeno pra qualquer tier gerenciado
