const { Client } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL || "postgres://ronda:ronda_dev@localhost:5432/ronda";

// Fonte: ISP-RJ (Instituto de Segurança Pública), BaseDPEvolucaoMensalCisp.csv
// (www.ispdados.rj.gov.br/Arquivos/BaseDPEvolucaoMensalCisp.csv, baixado 2026-08-05),
// somado ano-calendário 2025 completo (12 meses), filtrado município = Rio de Janeiro.
// Coordenadas: camada oficial "Delegacias de Polícia Civil do Estado do Rio de Janeiro"
// (PCERJ / Núcleo de Ciência de Dados do MPRJ, coleta jul/2025), via
// geo.mprj.mp.br/arcgis/rest/services/Seguranca_Publica/..., join pelo campo `cisp`.
//
// Diferença importante em relação a Belém: aqui roubo/furto por delegacia é CONTAGEM
// REAL (não heurística), mas o ISP-RJ não publica turno nem dia da semana — só total
// mensal. Por isso o índice de risco do RJ é constante entre dias/turnos (ver
// `has_temporal_data = false` em cities, e METHODOLOGY em routes/hotspots.ts).
//
// Ressalva conhecida (documentada em specs/data-sources.md): dado oficial de BO tende a
// subnotificar áreas de forte presença de facções/milícia, onde registro formal de
// ocorrência é raro — ex.: 11ª DP (Rocinha) aparece com volume muito baixo (8
// roubos/136 furtos em 2025) provavelmente por isso, não porque a área seja de fato mais
// segura. Isto é uma limitação da fonte oficial, não do cálculo do Ronda.
//
// [cisp, delegacia, bairro, lat, lng, total_roubos_2025, total_furtos_2025]
const DELEGACIAS = [
  [1, "1ª DP – Praça Mauá", "Praça Mauá", -22.90325882, -43.19114784, 1291, 4711],
  [4, "4ª DP – Praça da República", "Praça da República", -22.90325882, -43.19114784, 863, 3030],
  [5, "5ª DP – Mem de Sá", "Mem de Sá", -22.9099304, -43.1842794, 2251, 7129],
  [6, "6ª DP – Cidade Nova", "Cidade Nova", -22.9087781, -43.1961017, 848, 2383],
  [7, "7ª DP – Santa Teresa", "Santa Teresa", -22.9243868, -43.1872818, 375, 816],
  [9, "9ª DP – Catete", "Catete", -22.92380573, -43.17747945, 1884, 5806],
  [10, "10ª DP – Botafogo", "Botafogo", -22.94784146, -43.18602334, 1596, 5023],
  [11, "11ª DP – Rocinha", "Rocinha", -22.99296035, -43.25211128, 8, 136],
  [12, "12ª DP – Copacabana", "Copacabana", -22.9675091, -43.1845257, 483, 5786],
  [13, "13ª DP – Ipanema", "Ipanema", -22.98269043, -43.19109632, 311, 3098],
  [14, "14ª DP – Leblon", "Leblon", -22.9818503, -43.21859551, 652, 6552],
  [15, "15ª DP – Gávea", "Gávea", -22.9723371, -43.22587499, 448, 2229],
  [16, "16ª DP – Barra da Tijuca", "Barra da Tijuca", -23.01091921, -43.29694995, 1958, 7459],
  [17, "17ª DP – São Cristóvão", "São Cristóvão", -22.9043459, -43.2186503, 1433, 3437],
  [18, "18ª DP – Praça da Bandeira", "Praça da Bandeira", -22.9132873, -43.2147555, 2542, 5173],
  [19, "19ª DP – Tijuca", "Tijuca", -22.9306965, -43.2447908, 1850, 3776],
  [20, "20ª DP – Vila Isabel", "Vila Isabel", -22.91139488, -43.2394338, 1239, 2486],
  [21, "21ª DP – Bonsucesso", "Bonsucesso", -22.87267266, -43.25835739, 2536, 3801],
  [22, "22ª DP – Penha", "Penha", -22.8278758, -43.2762049, 1201, 1890],
  [23, "23ª DP – Méier", "Méier", -22.8990106, -43.2779497, 883, 1495],
  [24, "24ª DP – Piedade", "Piedade", -22.8933613, -43.3050189, 1884, 2178],
  [25, "25ª DP – Engenho Novo", "Engenho Novo", -22.89983305, -43.25242146, 1300, 2025],
  [26, "26ª DP – Todos os Santos", "Todos os Santos", -22.90225003, -43.29041108, 1449, 2050],
  [27, "27ª DP – Vicente de Carvalho", "Vicente de Carvalho", -22.84549552, -43.30435057, 3306, 2084],
  [28, "28ª DP – Praça Seca", "Praça Seca", -22.88922198, -43.3460434, 1150, 1195],
  [29, "29ª DP – Madureira", "Madureira", -22.86826073, -43.34382296, 3655, 3817],
  [30, "30ª DP – Marechal Hermes", "Marechal Hermes", -22.86271746, -43.37686147, 1820, 1502],
  [31, "31ª DP – Ricardo de Albuquerque", "Ricardo de Albuquerque", -22.83666982, -43.39693248, 1575, 827],
  [32, "32ª DP – Taquara", "Taquara", -22.92651781, -43.37511124, 2998, 5263],
  [33, "33ª DP – Realengo", "Realengo", -22.88441379, -43.40423684, 1483, 1832],
  [34, "34ª DP – Bangu", "Bangu", -22.87455208, -43.46317001, 1934, 2663],
  [35, "35ª DP – Campo Grande", "Campo Grande", -22.9042493, -43.5663525, 2189, 5502],
  [36, "36ª DP – Santa Cruz", "Santa Cruz", -22.91439896, -43.68455487, 852, 1595],
  [37, "37ª DP – Ilha do Governador", "Ilha do Governador", -22.80820159, -43.19688734, 302, 1495],
  [38, "38ª DP – Brás de Pina", "Brás de Pina", -22.83669856, -43.31672894, 1785, 1182],
  [39, "39ª DP – Pavuna", "Pavuna", -22.80602826, -43.36402984, 3318, 1645],
  [40, "40ª DP – Honório Gurgel", "Honório Gurgel", -22.84064568, -43.3490502, 2077, 1135],
  [41, "41ª DP – Tanque", "Tanque", -22.91972509, -43.3584989, 846, 1599],
  [42, "42ª DP – Recreio dos Bandeirantes", "Recreio dos Bandeirantes", -23.02278352, -43.49211627, 1245, 3506],
  [43, "43ª DP – Guaratiba", "Guaratiba", -22.98360725, -43.66166586, 572, 758],
  [44, "44ª DP – Inhaúma", "Inhaúma", -22.87392371, -43.28543104, 1740, 1637],
];

const MAX_VOLUME = Math.max(...DELEGACIAS.map(([, , , , , roubo, furto]) => roubo + furto));

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// Sem eixo temporal real: intensidade = volume da delegacia relativo à mais movimentada
// do RJ; a divisão entre roubo/furto usa a proporção real observada naquela delegacia
// (não uma média global, ao contrário de Belém).
function probabilities(roubo, furto) {
  const total = roubo + furto;
  const relative = total / MAX_VOLUME;
  const rouboShare = total > 0 ? roubo / total : 0.5;
  const furtoShare = total > 0 ? furto / total : 0.5;
  return {
    roubo: clamp(relative * rouboShare, 0.03, 0.97),
    furto: clamp(relative * furtoShare, 0.03, 0.97),
  };
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  await client.query("BEGIN");

  const cityRes = await client.query(
    `INSERT INTO cities (slug, name, state, center_lat, center_lng, default_zoom, has_temporal_data)
     VALUES ('rio-de-janeiro', 'Rio de Janeiro', 'RJ', -22.9068, -43.4310, 10, false)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, has_temporal_data = EXCLUDED.has_temporal_data
     RETURNING id`
  );
  const cityId = cityRes.rows[0].id;

  await client.query("DELETE FROM incident_patterns WHERE hotspot_id IN (SELECT id FROM hotspots WHERE city_id = $1)", [cityId]);
  await client.query("DELETE FROM hotspots WHERE city_id = $1", [cityId]);

  for (const [, delegacia, bairro, lat, lng, roubo, furto] of DELEGACIAS) {
    const { roubo: pRoubo, furto: pFurto } = probabilities(roubo, furto);
    // base_weight só é usado por Belém pra reconstruir a fórmula por turno/dia;
    // aqui guardamos a intensidade relativa (0-3, mesma escala visual de Belém) apenas
    // como referência — o cálculo real está feito em `probabilities` acima.
    const baseWeight = clamp(((roubo + furto) / MAX_VOLUME) * 3, 0.05, 3);

    const hRes = await client.query(
      `INSERT INTO hotspots (city_id, name, neighborhood, lat, lng, base_weight)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [cityId, delegacia, bairro, lat, lng, baseWeight.toFixed(3)]
    );
    const hotspotId = hRes.rows[0].id;

    // Sem dado por turno/dia: grava o mesmo valor nas 7x4 combinações — schema
    // exige day_of_week/turno preenchidos, mas o índice não varia entre eles pro RJ.
    const rows = [];
    for (let day = 0; day <= 6; day++) {
      for (const turno of ["madrugada", "manha", "tarde", "noite"]) {
        rows.push([hotspotId, day, turno, "roubo", pRoubo.toFixed(3)]);
        rows.push([hotspotId, day, turno, "furto", pFurto.toFixed(3)]);
      }
    }
    const values = rows.map((_, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`).join(",");
    await client.query(
      `INSERT INTO incident_patterns (hotspot_id, day_of_week, turno, crime_type, probability) VALUES ${values}`,
      rows.flat()
    );
  }

  await client.query("COMMIT");
  console.log(`seed ok: ${DELEGACIAS.length} delegacias, rio-de-janeiro`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
