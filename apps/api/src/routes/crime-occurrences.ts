import type { FastifyInstance } from "fastify";
import { pool } from "../db.js";
import { isValidDay, isValidTurno } from "../lib/turno.js";

const METHODOLOGY =
  "Ocorrências individuais reais de roubo/furto (não estimativa), fonte: CODEC/SEGUP-PA (codec.segup.pa.gov.br), jan/2025 a ago/2026. Pontos agrupados em clusters no zoom afastado — dá zoom pra ver ocorrências individuais. Use os filtros pra restringir por data, dia da semana, turno, tipo ou bairro.";

export default async function crimeOccurrencesRoutes(app: FastifyInstance) {
  app.get("/api/crime-occurrences", async (req, reply) => {
    const query = req.query as Record<string, unknown>;
    const citySlug = typeof query.city === "string" ? query.city : "belem";

    const conditions = ["c.slug = $1"];
    const params: unknown[] = [citySlug];

    if (typeof query.from === "string" && query.from) {
      params.push(query.from);
      conditions.push(`o.occurred_at >= $${params.length}`);
    }
    if (typeof query.to === "string" && query.to) {
      params.push(query.to);
      conditions.push(`o.occurred_at < ($${params.length}::date + interval '1 day')`);
    }
    if (query.day_of_week !== undefined) {
      const day = Number(query.day_of_week);
      if (!isValidDay(day)) return reply.code(400).send({ error: "day_of_week inválido (0-6)" });
      params.push(day);
      conditions.push(`o.day_of_week = $${params.length}`);
    }
    if (typeof query.turno === "string" && query.turno) {
      if (!isValidTurno(query.turno)) return reply.code(400).send({ error: "turno inválido" });
      params.push(query.turno);
      conditions.push(`o.turno = $${params.length}`);
    }
    if (typeof query.crime_type === "string" && query.crime_type) {
      if (!["roubo", "furto"].includes(query.crime_type)) {
        return reply.code(400).send({ error: "crime_type inválido" });
      }
      params.push(query.crime_type);
      conditions.push(`o.crime_type = $${params.length}`);
    }
    if (typeof query.bairro === "string" && query.bairro) {
      params.push(query.bairro);
      conditions.push(`o.bairro = $${params.length}`);
    }

    const { rows } = await pool.query(
      `SELECT o.id, o.crime_type, o.bairro, o.occurred_at, o.lat, o.lng
         FROM crime_occurrences o
         JOIN cities c ON c.id = o.city_id
        WHERE ${conditions.join(" AND ")}
        ORDER BY o.occurred_at DESC`,
      params
    );

    const features = rows.map((r) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [Number(r.lng), Number(r.lat)] },
      properties: {
        id: r.id,
        crime_type: r.crime_type,
        bairro: r.bairro,
        occurred_at: r.occurred_at,
      },
    }));

    return {
      type: "FeatureCollection",
      features,
      meta: {
        city: citySlug,
        count: features.length,
        methodology: METHODOLOGY,
        source: "CODEC/SEGUP-PA — codec.segup.pa.gov.br",
      },
    };
  });

  app.get("/api/crime-occurrences/bairros", async (req) => {
    const query = req.query as Record<string, unknown>;
    const citySlug = typeof query.city === "string" ? query.city : "belem";

    const { rows } = await pool.query(
      `SELECT DISTINCT o.bairro
         FROM crime_occurrences o
         JOIN cities c ON c.id = o.city_id
        WHERE c.slug = $1
        ORDER BY o.bairro`,
      [citySlug]
    );

    return { bairros: rows.map((r) => r.bairro) };
  });
}
