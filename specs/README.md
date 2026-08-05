# Specs — Ronda

Índice da documentação de produto/técnica. Escrito em 2026-08-05 ao final da sessão que produziu o v0, pra qualquer pessoa (ou eu mesmo em outra sessão) retomar sem perder contexto.

- [product.md](product.md) — o que é, por quê, diferencial, origem
- [architecture.md](architecture.md) — stack, estrutura de pastas, decisões técnicas
- [data-sources.md](data-sources.md) — todas as fontes de dados encontradas, testadas, o que funcionou e o que não
- [methodology.md](methodology.md) — fórmula exata do índice de risco, números reais usados
- [environment-notes.md](environment-notes.md) — pegadinhas de ambiente (Docker/WSL, PostGIS, UAC) nesta máquina
- [roadmap.md](roadmap.md) — próximos passos priorizados
- [deploy.md](deploy.md) — plano de deploy (Vercel + host externo pra API/DB), ainda não executado

## Estado no fim da sessão v0

MVP rodando local, ponta a ponta validado no browser: mapa de Belém, 20 hotspots reais, índice de risco reativo a dia/turno, drill-down por clique, zero bugs conhecidos abertos (bug de CSS de posicionamento de marker foi encontrado e corrigido nesta mesma sessão).
