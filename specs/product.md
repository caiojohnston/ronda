# Produto

## O que é

Site com mapa interativo mostrando **onde** crimes (roubo/furto) tendem a acontecer numa cidade brasileira, por dia da semana e turno do dia. Zoom livre — dá pra ver a cidade inteira ou uma esquina específica. Pontos piscam com tamanho/cor proporcional ao risco. Clicar num ponto mostra o drill-down: probabilidade de roubo vs furto naquele local, naquele dia/turno.

Cidade inicial: **Belém, PA**. Arquitetura pensada pra multi-cidade desde o início (tabela `cities`).

## Por quê

Origem: a usuária foi assaltada no Ver-o-Peso (Belém), registrou BO, e percebeu que o boletim de ocorrência é dado público — só não é fácil de consultar de forma agregada e visual. A ideia nasceu da pergunta "por que ninguém mostra isso num mapa?".

## O diferencial (e a limitação, que é o ponto forte)

**Não é rastreamento em tempo real.** Não existe fonte pública que diga "um roubo está acontecendo agora nesta esquina". O que existe são **agregados históricos reais** (SEGUP-PA: quantos roubos por turno, por dia da semana, por município).

A aposta do produto: em vez de fingir tempo real (que seria falso), ser honesto sobre o que os dados realmente permitem — **precisão de localidade, não de instante**. "Terça-feira às 21h, neste ponto, historicamente há X% de chance de roubo" é uma afirmação defensável e útil. "Está acontecendo um roubo agora" não seria.

Esse framing honesto é comunicado na própria UI (nota de metodologia no drill-down, texto no TimeControl: "Índice de risco histórico por local — não é ocorrência em tempo real").

## Modo de uso pensado

1. Usuário abre o site, vê o mapa já no modo "Agora" (dia/turno atual, automático)
2. Pode alternar pra "Simulando" e testar outros dias/turnos manualmente (ex: "e se eu for sábado de manhã?")
3. Zoom pra ver macro (cidade inteira, cor por zona) ou micro (ponto específico, esquina)
4. Clique no ponto abre o "porquê" daquele risco (roubo vs furto, nota de metodologia)

## Público-alvo (hipótese, não validada com usuários ainda)

- Moradores planejando rotas/horários
- Turistas em áreas centrais (ex: Ver-o-Peso é destino turístico E hotspot)
- Jornalismo de dados / pesquisadores de segurança pública
- Eventualmente: poder público como ferramenta de transparência (irônico, já que os dados são deles)
