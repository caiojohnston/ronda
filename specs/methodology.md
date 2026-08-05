# Metodologia — índice de risco

Fonte da verdade: `db/seed.js`. Este arquivo explica o raciocínio; se os dois divergirem, o código manda.

## Fórmula (atualizada 2026-08-05 — dado real CODEC)

```
probability(bairro, day, turno, crime) =
  clamp(
    (total_bairro / max_total_entre_bairros)
    × (dayShare_bairro[day] / (1/7))
    × (turnoShare_bairro[turno] / (1/4))
    × (crimeShare_bairro[crime] / (1/2))
    × BASELINE,
    0.03, 0.97
  )
```

- `total_bairro`: contagem real de ocorrências (roubo+furto, jan/2025-ago/2026) daquele bairro especificamente — não mais heurística
- `dayShare_bairro`, `turnoShare_bairro`, `crimeShare_bairro`: distribuição real **daquele bairro**, calculada a partir das próprias ocorrências dele — cada bairro tem sua curva, não uma curva média da cidade aplicada a todos
- `BASELINE = 0.601`: mesma constante de calibração da versão anterior, mantida por continuidade de escala

A lógica é a mesma de antes (cada fator normalizado pela própria média, só desvio real move o número) — o que mudou é a fonte: `base_weight`/`DAY_SHARE`/`TURNO_SHARE`/`CRIME_SHARE` eram heurística+agregado-da-cidade; agora são contagem real por bairro, vinda de `db/data/codec-belem-occurrences.csv` (60.335 ocorrências individuais, ver [data-sources.md](data-sources.md)).

**Ressalva:** bairros com poucas ocorrências no período têm `dayShare`/`turnoShare` mais sujeitos a ruído estatístico — um único registro pode dominar um dia da semana. Mesma limitação de fundo documentada pra Rocinha/RJ, aqui pelo mesmo motivo (n pequeno), não por subnotificação.

## Por que `Math.max(roubo, furto)` no frontend

A API retorna `roubo_probability` e `furto_probability` separados. O frontend (`apps/web/src/lib/api.ts` consumido em `MapView.tsx`) usa o maior dos dois como `intensity` pra definir tamanho/cor do marker — mostra o "pior caso" relevante daquele ponto, não uma média. Decisão de produto, não uma limitação técnica; fácil de trocar por uma média ponderada se fizer mais sentido depois.

## Hotspots do v0 (Belém): 68 bairros reais

**Não é mais heurística.** Desde 2026-08-05, `db/seed.js` lê `db/data/codec-belem-occurrences.csv` (exportação manual do CODEC/SEGUP-PA, feita pelo usuário) e gera 1 hotspot por bairro real (68 no total), no centróide (lat/lng médio) das ocorrências daquele bairro, com `base_weight = total de ocorrências reais do bairro`. Os 20 landmarks estimados à mão (Ver-o-Peso, Praça do Comércio etc.) foram **substituídos**, não mantidos em paralelo — essa era exatamente a lacuna que o pedido de LAI tentava resolver, e o CODEC voltou ao ar antes da resposta formal.

Isso também virou a fonte da camada de pontos brutos no mapa (`crime_occurrences`, ver seção de clustering abaixo) — mesmo CSV, duas visões: uma agregada (índice de risco), uma bruta (ocorrência por ocorrência, clusterizada).

**Quando o LAI ou o CODEC devolverem período maior** (o CSV atual cobre jan/2025-ago/2026), o certo é reexportar e rerodar `npm run db:seed` — a estrutura já comporta, é só trocar o CSV de entrada.

## Rio de Janeiro: sem eixo temporal

Fonte da verdade: `db/seed-rio.js`. Segunda cidade do produto (adicionada 2026-08-05), e o inverso exato de Belém em termos de qual eixo é real vs. estimado:

| Eixo | Belém | Rio de Janeiro |
|---|---|---|
| Local (peso por ponto) | **Real** — contagem de ocorrências por bairro (CODEC/SEGUP-PA, 2025-2026) | **Real** — contagem oficial de BOs por delegacia (ISP-RJ, 2025) |
| Turno/dia da semana | **Real e local** — distribuição própria de cada bairro | Não existe na fonte — índice fixo |
| Tipo de crime (roubo/furto) | **Real e local** — proporção observada naquele bairro específico | **Real e local** — proporção observada naquela delegacia específica |

(Até 2026-08-05, Belém era o inverso: local heurístico, turno/dia real-mas-global. CODEC virou o LAI que faltava — ver seção acima.)

Fórmula (sem os fatores de dia/turno, que Belém tem e RJ não):

```
relative = (total_roubos_2025 + total_furtos_2025) / max_volume_entre_as_41_delegacias
probability(roubo) = clamp(relative × (roubo / (roubo + furto)), 0.03, 0.97)
probability(furto) = clamp(relative × (furto / (roubo + furto)), 0.03, 0.97)
```

`probability(roubo) + probability(furto) = relative` — a "intensidade total" do ponto é sempre a fração do volume da delegacia mais movimentada do Rio, dividida na proporção real observada ali entre roubo e furto.

**Decisão de produto (não técnica):** em vez de reusar `TURNO_SHARE`/`DAY_SHARE` do Pará como proxy pro Rio — o que inventaria uma variação horária que não foi observada localmente —, o índice do RJ fica constante entre dias/turnos. Isso é sinalizado em `cities.has_temporal_data = false`, propagado pela API (`meta.temporal_data` / `HotspotDetail.temporal_data`) e pela UI: seletor de dia/turno fica desabilitado e um aviso âmbar explica o motivo (`TimeControl.tsx`, `HotspotDetail.tsx`). Decidido em conversa com o usuário em 2026-08-05 depois de inspecionar o CSV real e confirmar a ausência da coluna — ver alternativas descartadas (reusar curva nacional, reusar curva de Belém rotulada) no histórico da conversa.

Coordenadas: sede oficial de cada uma das 41 delegacias distritais (categoria "Capital") do município do Rio de Janeiro, ver [data-sources.md](data-sources.md).

## Violência armada (Fogo Cruzado)

Camada adicionada em 2026-08-05, fonte da verdade em `db/fetch-fogo-cruzado.js`. **Não é o índice de risco de roubo/furto** — é uma camada opcional, desligada por padrão, com dado de outro fenômeno (tiroteio/violência armada) vindo do Instituto Fogo Cruzado. Diferenças importantes em relação a `hotspots`/`incident_patterns`:

- **Evento pontual real, não probabilidade agregada.** Cada ponto no mapa é um tiroteio específico que já aconteceu, com data, endereço e bairro reais — não um índice calculado. Por isso mora em tabela própria (`armed_violence_events`), não em `incident_patterns`.
- **Sem fórmula.** Não há cálculo de risco aqui — a API devolve os eventos brutos (últimos 180 dias por padrão) e o frontend só desenha um ponto por evento.
- **Cobertura:** só Belém tem dado até agora (Fogo Cruzado mapeia a Região Metropolitana de Belém desde novembro/2023; RJ e outras cidades do produto não têm essa camada ainda, mesmo o Rio sendo uma das áreas históricas do Fogo Cruzado — precisaria rodar `fetch-fogo-cruzado.js` também pro RJ, não feito ainda). A UI mostra "sem eventos" em vez de esconder o toggle, pra deixar claro que é falta de cobertura, não bug.
- **Por que não vira um terceiro fator na fórmula de risco:** roubo/furto e tiroteio são crimes de natureza diferente (patrimonial vs. violência armada), com dinâmicas espaciais diferentes — misturar os dois numa única "probabilidade" seria inventar uma equivalência que não existe nos dados. Ficam como camadas visuais separadas, cada uma com sua própria nota de metodologia (`meta.methodology` em `/api/hotspots` vs. `/api/armed-violence`).

## Ocorrências reais clusterizadas (CODEC)

Camada adicionada em 2026-08-05, fonte da verdade em `db/import-crime-occurrences.js` + `apps/api/src/routes/crime-occurrences.ts`. Mesmo CSV que alimenta o índice agregado (`db/seed.js`), mas aqui **sem agregação** — cada ponto no mapa é uma ocorrência real de roubo/furto, individual.

- **60.335 pontos** — grande demais pra desenhar como `maplibregl.Marker` (HTML por ponto, como `hotspots`/`armed_violence_events` fazem). Por isso é a primeira camada do produto a usar **GeoJSON source com clustering nativo do MapLibre** (`cluster: true`, `clusterRadius: 50`, `clusterMaxZoom: 15`) — círculos agrupados coloridos/dimensionados por `point_count` (expressão `step`), que se desagrupam em pontos individuais conforme o usuário dá zoom. Clique num cluster chama `getClusterExpansionZoom` e centraliza+zoom; clique num ponto individual abre `CrimeOccurrenceDetail`.
- **Opt-in, desligado por padrão** (mesma convenção da camada de violência armada) — 60k pontos de cara deixaria o mapa poluído antes do usuário escolher olhar.
- **Coexiste com os hotspots pulsantes do índice de risco**, que ficam no mesmo centróide de bairro — como os markers de hotspot são HTML (`maplibregl.Marker`, DOM) e a camada de ocorrências é canvas WebGL (layer do MapLibre), o DOM sempre fica por cima: clicar num ponto que coincide com o centróide do bairro abre o drawer do hotspot, não o da ocorrência. Pra abrir o drawer de uma ocorrência específica, clique num ponto desagrupado que não esteja exatamente sobre o marker pulsante (dá zoom até separar visualmente).
