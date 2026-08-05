const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL || "postgres://ronda:ronda_dev@localhost:5432/ronda";

// Fonte: CODEC (codec.segup.pa.gov.br), exportação manual do usuário em 2026-08-05 —
// ocorrências individuais de roubo/furto em Belém, jan/2025 a ago/2026. Ver
// db/data/codec-belem-occurrences.csv e specs/data-sources.md.
//
// Substitui o modelo heurístico anterior (20 landmarks com peso estimado à mão): agora
// hotspots = 1 por bairro real (68), no centróide das ocorrências daquele bairro, e
// incident_patterns = probabilidade calculada a partir da distribuição REAL de
// dia-da-semana/turno/tipo-de-crime daquele bairro especificamente — não mais um share
// médio da cidade aplicado a todo mundo igual.
//
// Ressalva: alguns bairros têm poucas ocorrências no período — a distribuição
// dia/turno desses fica mais sujeita a ruído estatístico (um único registro pode
// dominar um dia). Mesma limitação documentada para Rocinha/RJ em specs/data-sources.md.
const CSV_PATH = path.join(__dirname, "data", "codec-belem-occurrences.csv");
const TURNOS = ["madrugada", "manha", "tarde", "noite"];
const CRIMES = ["roubo", "furto"];
const AVG_DAY = 1 / 7;
const AVG_TURNO = 1 / 4;
const AVG_CRIME = 1 / 2;
const BASELINE = 0.601;

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function titleCase(s) {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => (w.length <= 2 ? w : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

function parseCsv(text) {
  const [header, ...lines] = text.trim().split(/\r?\n/);
  const cols = header.split(",");
  return lines.map((line) => {
    const values = line.split(",");
    const row = {};
    cols.forEach((c, i) => (row[c] = values[i]));
    return row;
  });
}

function loadOccurrences() {
  const text = fs.readFileSync(CSV_PATH, "utf8");
  return parseCsv(text).map((r) => ({
    crimeType: r.crime_type,
    bairro: r.bairro,
    dayOfWeek: Number(r.day_of_week),
    turno: r.turno,
    lat: Number(r.lat),
    lng: Number(r.lng),
  }));
}

function buildBairros(occurrences) {
  const byBairro = new Map();
  for (const occ of occurrences) {
    if (!byBairro.has(occ.bairro)) {
      byBairro.set(occ.bairro, { name: occ.bairro, rows: [], latSum: 0, lngSum: 0 });
    }
    const b = byBairro.get(occ.bairro);
    b.rows.push(occ);
    b.latSum += occ.lat;
    b.lngSum += occ.lng;
  }

  const maxVolume = Math.max(...[...byBairro.values()].map((b) => b.rows.length));

  return [...byBairro.values()].map((b) => {
    const total = b.rows.length;
    const lat = b.latSum / total;
    const lng = b.lngSum / total;

    const dayCount = {};
    const turnoCount = {};
    const crimeCount = {};
    const cellCount = {}; // `${day}|${turno}|${crime}` -> count
    for (const occ of b.rows) {
      dayCount[occ.dayOfWeek] = (dayCount[occ.dayOfWeek] || 0) + 1;
      turnoCount[occ.turno] = (turnoCount[occ.turno] || 0) + 1;
      crimeCount[occ.crimeType] = (crimeCount[occ.crimeType] || 0) + 1;
      const key = `${occ.dayOfWeek}|${occ.turno}|${occ.crimeType}`;
      cellCount[key] = (cellCount[key] || 0) + 1;
    }

    const w = total / maxVolume;
    const probabilities = [];
    for (let day = 0; day <= 6; day++) {
      for (const turno of TURNOS) {
        for (const crime of CRIMES) {
          const fDay = (dayCount[day] || 0) / total / AVG_DAY;
          const fTurno = (turnoCount[turno] || 0) / total / AVG_TURNO;
          const fCrime = (crimeCount[crime] || 0) / total / AVG_CRIME;
          const probability = clamp(w * fDay * fTurno * fCrime * BASELINE, 0.03, 0.97);
          probabilities.push([day, turno, crime, probability.toFixed(3)]);
        }
      }
    }

    return { name: b.name, lat, lng, total, probabilities };
  });
}

async function main() {
  const occurrences = loadOccurrences();
  const bairros = buildBairros(occurrences);

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  await client.query("BEGIN");

  const cityRes = await client.query(
    `INSERT INTO cities (slug, name, state, center_lat, center_lng, default_zoom)
     VALUES ('belem', 'Belém', 'PA', -1.4558, -48.4902, 12)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`
  );
  const cityId = cityRes.rows[0].id;

  await client.query("DELETE FROM incident_patterns WHERE hotspot_id IN (SELECT id FROM hotspots WHERE city_id = $1)", [cityId]);
  await client.query("DELETE FROM hotspots WHERE city_id = $1", [cityId]);

  for (const bairro of bairros) {
    const hRes = await client.query(
      `INSERT INTO hotspots (city_id, name, neighborhood, lat, lng, base_weight)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [cityId, titleCase(bairro.name), "Belém · PA", bairro.lat, bairro.lng, bairro.total]
    );
    const hotspotId = hRes.rows[0].id;

    const rows = bairro.probabilities.map(([day, turno, crime, probability]) => [
      hotspotId,
      day,
      turno,
      crime,
      probability,
    ]);
    const values = rows.map((_, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`).join(",");
    await client.query(
      `INSERT INTO incident_patterns (hotspot_id, day_of_week, turno, crime_type, probability) VALUES ${values}`,
      rows.flat()
    );
  }

  await client.query("COMMIT");
  console.log(`seed ok: ${bairros.length} bairros (dado real CODEC), belem`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
