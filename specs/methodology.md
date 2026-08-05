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
