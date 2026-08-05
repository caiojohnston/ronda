const { Client } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL || "postgres://ronda:ronda_dev@localhost:5432/ronda";
const FC_BASE = "https://api-service.fogocruzado.org.br/api/v2";
const CITY_SLUG = "belem";
const CITY_NAME_FC = "Belém"; // nome exato usado pela API do Fogo Cruzado

// Busca eventos de violência armada (tiroteios) do Instituto Fogo Cruzado
// (api.fogocruzado.org.br) e sincroniza na tabela armed_violence_events.
// Requer FOGOCRUZADO_EMAIL/FOGOCRUZADO_PASSWORD no ambiente (ver .env.example) —
// rodar com `node --env-file=.env db/fetch-fogo-cruzado.js` a partir da raiz do repo.
// Fenômeno diferente de roubo/furto: não entra na fórmula de risco existente,
// é sincronizado à parte. Idempotente (upsert por external_id) — seguro rodar de novo
// pra pegar ocorrências novas.

async function login() {
  const email = process.env.FOGOCRUZADO_EMAIL;
  const password = process.env.FOGOCRUZADO_PASSWORD;
  if (!email || !password) {
    throw new Error("FOGOCRUZADO_EMAIL / FOGOCRUZADO_PASSWORD não definidos no ambiente (ver .env.example)");
  }
  const res = await fetch(`${FC_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`login Fogo Cruzado falhou: HTTP ${res.status}`);
  const body = await res.json();
  return body.data.accessToken;
}

async function findCity(token, cityName) {
  const res = await fetch(`${FC_BASE}/cities?take=500`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`GET /cities falhou: HTTP ${res.status}`);
  const body = await res.json();
  const city = body.data.find((c) => c.name === cityName);
  if (!city) throw new Error(`Cidade "${cityName}" não encontrada na API do Fogo Cruzado`);
  return city; // { id, name, state: { id, name } }
}

async function fetchAllOccurrences(token, stateId, cityId) {
  const all = [];
  let page = 1;
  while (true) {
    const url = `${FC_BASE}/occurrences?idState=${stateId}&idCities=${cityId}&take=100&page=${page}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`GET /occurrences (page ${page}) falhou: HTTP ${res.status}`);
    const body = await res.json();
    all.push(...body.data);
    if (!body.pageMeta.hasNextPage) break;
    page += 1;
  }
  return all;
}

async function main() {
  console.log("autenticando na API do Fogo Cruzado...");
  const token = await login();

  console.log(`buscando cidade "${CITY_NAME_FC}"...`);
  const fcCity = await findCity(token, CITY_NAME_FC);

  console.log("baixando ocorrências (paginado)...");
  const occurrences = await fetchAllOccurrences(token, fcCity.state.id, fcCity.id);
  console.log(`${occurrences.length} ocorrências recebidas`);

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  const cityRes = await client.query("SELECT id FROM cities WHERE slug = $1", [CITY_SLUG]);
  if (cityRes.rows.length === 0) {
    throw new Error(`Cidade "${CITY_SLUG}" não existe em cities — rode npm run db:seed primeiro`);
  }
  const cityId = cityRes.rows[0].id;

  await client.query("BEGIN");

  let inserted = 0;
  for (const occ of occurrences) {
    const victimCount = occ.victims.length;
    const deathCount = occ.victims.filter((v) => v.situation === "Dead").length;
    await client.query(
      `INSERT INTO armed_violence_events
         (city_id, external_id, occurred_at, lat, lng, neighborhood, address, main_reason, victim_count, death_count, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'fogo_cruzado')
       ON CONFLICT (external_id) DO UPDATE SET
         occurred_at = EXCLUDED.occurred_at,
         lat = EXCLUDED.lat,
         lng = EXCLUDED.lng,
         neighborhood = EXCLUDED.neighborhood,
         address = EXCLUDED.address,
         main_reason = EXCLUDED.main_reason,
         victim_count = EXCLUDED.victim_count,
         death_count = EXCLUDED.death_count`,
      [
        cityId,
        occ.id,
        occ.date,
        Number(occ.latitude),
        Number(occ.longitude),
        occ.neighborhood?.name ?? null,
        occ.address ?? null,
        occ.contextInfo?.mainReason?.name ?? null,
        victimCount,
        deathCount,
      ]
    );
    inserted += 1;
  }

  await client.query("COMMIT");
  console.log(`sync ok: ${inserted} eventos de violência armada (Belém, Fogo Cruzado)`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
