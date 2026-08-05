# Metodologia — índice de risco

Fonte da verdade: `db/seed.js`. Este arquivo explica o raciocínio; se os dois divergirem, o código manda.

## Fórmula

```
probability(hotspot, day, turno, crime) =
  clamp(
    (base_weight / MAX_WEIGHT)
    × (DAY_SHARE[day] / (1/7))
    × (TURNO_SHARE[turno] / (1/4))
    × (CRIME_SHARE[crime] / (1/2))
    × BASELINE,
    0.03, 0.97
  )
```

- `base_weight`: heurística por hotspot (1.0 a 3.0), ver seção abaixo
- `MAX_WEIGHT = 3.0` (peso do Ver-o-Peso, o mais alto)
- `DAY_SHARE`, `TURNO_SHARE`, `CRIME_SHARE`: participação real (%) vinda da SEGUP-PA — ver [data-sources.md](data-sources.md)
- `BASELINE = 0.601`: constante de calibração pra que o caso máximo (peso 3.0, segunda, manhã, roubo) fique perto de 0.9 e o mínimo (peso 1.0, sábado, madrugada, furto) fique perto de 0.07

A lógica: cada fator é normalizado pela sua própria média (`/(1/N)`), então um dia/turno/crime "mediano" não altera o peso base do hotspot; só desvios reais da média (ex: madrugada é bem abaixo da média, puxa o índice pra baixo) movem o número.

## Por que `Math.max(roubo, furto)` no frontend

A API retorna `roubo_probability` e `furto_probability` separados. O frontend (`apps/web/src/lib/api.ts` consumido em `MapView.tsx`) usa o maior dos dois como `intensity` pra definir tamanho/cor do marker — mostra o "pior caso" relevante daquele ponto, não uma média. Decisão de produto, não uma limitação técnica; fácil de trocar por uma média ponderada se fizer mais sentido depois.

## Hotspots do v0 (Belém) e pesos

20 landmarks/bairros conhecidos. Pesos são **heurística**, baseada em fluxo público/densidade comercial e no relato que originou o projeto — não é contagem oficial por endereço.

| Nome | Bairro | Peso |
|---|---|---|
| Ver-o-Peso | Campina/Comércio | 3.0 |
| Praça do Comércio | Comércio | 2.6 |
| Guamá | Guamá | 2.4 |
| Jurunas | Jurunas | 2.2 |
| Terra Firme | Terra Firme | 2.1 |
| Cidade Velha | Cidade Velha | 2.0 |
| Condor | Condor | 1.9 |
| Campina | Campina | 1.8 |
| Ver-o-Rio | Icoaraci | 1.7 |
| Batista Campos | Batista Campos | 1.6 |
| Sacramenta | Sacramenta | 1.6 |
| Souza | Souza | 1.6 |
| Reduto | Reduto | 1.5 |
| Marco | Marco | 1.5 |
| Telégrafo | Telégrafo | 1.5 |
| Praça da República | Nazaré | 1.4 |
| Pedreira | Pedreira | 1.4 |
| Umarizal | Umarizal | 1.3 |
| Val-de-Cans | Val-de-Cans | 1.3 |
| Marambaia | Marambaia | 1.0 |

**Quando trocar por dado real:** se/quando LAI ou CODEC devolverem dado por logradouro (ver [data-sources.md](data-sources.md)), o certo é substituir tanto as coordenadas quanto os pesos por contagens reais, e trocar a fórmula de `base_weight` heurístico por uma contagem observada normalizada. A estrutura de `incident_patterns` já comporta isso sem mudar schema.

## Rio de Janeiro: sem eixo temporal

Fonte da verdade: `db/seed-rio.js`. Segunda cidade do produto (adicionada 2026-08-05), e o inverso exato de Belém em termos de qual eixo é real vs. estimado:

| Eixo | Belém | Rio de Janeiro |
|---|---|---|
| Local (peso por ponto) | Heurística (fluxo público, achado de reportagem) | **Real** — contagem oficial de BOs por delegacia (ISP-RJ, 2025) |
| Turno/dia da semana | **Real** — agregado SEGUP-PA | Não existe na fonte — índice fixo |
| Tipo de crime (roubo/furto) | Real, mas participação **global** do Pará aplicada a todo hotspot | **Real e local** — proporção observada naquela delegacia específica |

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
