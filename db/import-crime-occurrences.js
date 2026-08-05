const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL || "postgres://ronda:ronda_dev@localhost:5432/ronda";
const CSV_PATH = path.join(__dirname, "data", "codec-belem-occurrences.csv");
const CITY_SLUG = "belem";
const BATCH_SIZE = 1000;

// Carrega ocorrências brutas (uma linha = uma ocorrência real) na tabela
// crime_occurrences, usada pela camada de clustering do mapa. Fonte: mesmo CSV usado
// por db/seed.js pro índice agregado — ver comentário lá. Reimportação total
// (DELETE + insert) a cada rodada, já que é um snapshot estático exportado manualmente,
// não uma fonte com sync incremental.
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

async function main() {
  const rows = parseCsv(fs.readFileSync(CSV_PATH, "utf8"));

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  const cityRes = await client.query("SELECT id FROM cities WHERE slug = $1", [CITY_SLUG]);
  if (cityRes.rows.length === 0) {
    throw new Error(`Cidade "${CITY_SLUG}" não existe em cities — rode npm run db:seed primeiro`);
  }
  const cityId = cityRes.rows[0].id;

  await client.query("BEGIN");
  await client.query("DELETE FROM crime_occurrences WHERE city_id = $1", [cityId]);

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const values = batch
      .map((_, j) => `($1, $${j * 7 + 2}, $${j * 7 + 3}, $${j * 7 + 4}, $${j * 7 + 5}, $${j * 7 + 6}, $${j * 7 + 7}, $${j * 7 + 8})`)
      .join(",");
    const params = [cityId];
    for (const r of batch) {
      params.push(r.crime_type, r.bairro, r.occurred_at, r.day_of_week, r.turno, r.lat, r.lng);
    }
    await client.query(
      `INSERT INTO crime_occurrences (city_id, crime_type, bairro, occurred_at, day_of_week, turno, lat, lng)
       VALUES ${values}`,
      params
    );
  }

  await client.query("COMMIT");
  console.log(`import ok: ${rows.length} ocorrências (CODEC, belém)`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
