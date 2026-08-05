const { Client } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL || "postgres://ronda:ronda_dev@localhost:5432/ronda";

// Fontes: SEGUP-PA (Power BI "Portal da Transparência", scrape 2026-08-04) + Fórum Brasileiro
// de Segurança Pública. Turno/dia_semana = agregados reais do Pará. base_weight por hotspot =
// heurística (fluxo público, densidade comercial, achados de reportagem local) — não é contagem
// oficial por endereço. Ver README > Metodologia.
const TURNO_SHARE = { madrugada: 0.1076, manha: 0.3203, tarde: 0.2989, noite: 0.2732 };
const DAY_SHARE = { 0: 0.1375, 1: 0.155, 2: 0.1444, 3: 0.1454, 4: 0.1413, 5: 0.1463, 6: 0.1303 }; // 0=dom..6=sab
const CRIME_SHARE = { roubo: 0.5385, furto: 0.4615 };

const AVG_DAY = 1 / 7;
const AVG_TURNO = 1 / 4;
const AVG_CRIME = 1 / 2;
const BASELINE = 0.601;
const MAX_WEIGHT = 3.0;

const HOTSPOTS = [
  ["Ver-o-Peso", "Campina/Comércio", -1.4523, -48.5031, 3.0],
  ["Praça do Comércio", "Comércio", -1.454, -48.501, 2.6],
  ["Cidade Velha", "Cidade Velha", -1.4555, -48.504, 2.0],
  ["Batista Campos", "Batista Campos", -1.4565, -48.488, 1.6],
  ["Praça da República", "Nazaré", -1.449, -48.4735, 1.4],
  ["Reduto", "Reduto", -1.461, -48.49, 1.5],
  ["Umarizal", "Umarizal", -1.446, -48.472, 1.3],
  ["Campina", "Campina", -1.453, -48.495, 1.8],
  ["Jurunas", "Jurunas", -1.466, -48.496, 2.2],
  ["Guamá", "Guamá", -1.471, -48.472, 2.4],
  ["Terra Firme", "Terra Firme", -1.439, -48.453, 2.1],
  ["Condor", "Condor", -1.433, -48.468, 1.9],
  ["Marco", "Marco", -1.427, -48.4625, 1.5],
  ["Pedreira", "Pedreira", -1.435, -48.476, 1.4],
  ["Sacramenta", "Sacramenta", -1.411, -48.466, 1.6],
  ["Telégrafo", "Telégrafo", -1.421, -48.461, 1.5],
  ["Marambaia", "Marambaia", -1.4005, -48.4455, 1.0],
  ["Ver-o-Rio", "Icoaraci", -1.2985, -48.4785, 1.7],
  ["Val-de-Cans", "Val-de-Cans", -1.38, -48.479, 1.3],
  ["Souza", "Souza", -1.46, -48.4855, 1.6],
];

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function probability(baseWeight, day, turno, crime) {
  const w = baseWeight / MAX_WEIGHT;
  const fDay = DAY_SHARE[day] / AVG_DAY;
  const fTurno = TURNO_SHARE[turno] / AVG_TURNO;
  const fCrime = CRIME_SHARE[crime] / AVG_CRIME;
  return clamp(w * fDay * fTurno * fCrime * BASELINE, 0.03, 0.97);
}

async function main() {
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

  for (const [name, neighborhood, lat, lng, weight] of HOTSPOTS) {
    const hRes = await client.query(
      `INSERT INTO hotspots (city_id, name, neighborhood, lat, lng, base_weight)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [cityId, name, neighborhood, lat, lng, weight]
    );
    const hotspotId = hRes.rows[0].id;

    const rows = [];
    for (let day = 0; day <= 6; day++) {
      for (const turno of Object.keys(TURNO_SHARE)) {
        for (const crime of Object.keys(CRIME_SHARE)) {
          rows.push([hotspotId, day, turno, crime, probability(weight, day, turno, crime).toFixed(3)]);
        }
      }
    }
    const values = rows.map((_, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`).join(",");
    await client.query(
      `INSERT INTO incident_patterns (hotspot_id, day_of_week, turno, crime_type, probability) VALUES ${values}`,
      rows.flat()
    );
  }

  await client.query("COMMIT");
  console.log(`seed ok: ${HOTSPOTS.length} hotspots, belem`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
