import type { FastifyInstance } from "fastify";
import { pool } from "../db.js";
import { currentDayAndTurno, isValidDay, isValidTurno } from "../lib/turno.js";

const METHODOLOGY =
  "Índice estimado a partir de agregados reais da SEGUP-PA (turno e dia da semana) combinados a um peso heurístico por local (fluxo público, densidade comercial). Não representa ocorrência confirmada nem dado em tempo real — mostra onde e quando o risco histórico é maior.";

function parseDayTurno(query: Record<string, unknown>) {
  const now = currentDayAndTurno();
  const day = query.day !== undefined ? Number(query.day) : now.day;
  const turno = typeof query.turno === "string" ? query.turno : now.turno;
  if (!isValidDay(day)) throw { statusCode: 400, message: "day inválido (0-6)" };
  if (!isValidTurno(turno)) throw { statusCode: 400, message: "turno inválido" };
  return { day, turno };
}

export default async function hotspotsRoutes(app: FastifyInstance) {
  app.get("/api/hotspots", async (req, reply) => {
    const query = req.query as Record<string, unknown>;
    const citySlug = typeof query.city === "string" ? query.city : "belem";
    let day: number, turno: string;
    try {
      ({ day, turno } = parseDayTurno(query));
    } catch (e: any) {
      return reply.code(e.statusCode).send({ error: e.message });
    }

    const { rows } = await pool.query(
      `SELECT h.id, h.name, h.neighborhood, h.lat, h.lng,
              MAX(CASE WHEN ip.crime_type = 'roubo' THEN ip.probability END) AS roubo_probability,
              MAX(CASE WHEN ip.crime_type = 'furto' THEN ip.probability END) AS furto_probability
         FROM hotspots h
         JOIN cities c ON c.id = h.city_id
         JOIN incident_patterns ip ON ip.hotspot_id = h.id AND ip.day_of_week = $2 AND ip.turno = $3
        WHERE c.slug = $1
        GROUP BY h.id, h.name, h.neighborhood, h.lat, h.lng
        ORDER BY h.id`,
      [citySlug, day, turno]
    );

    const features = rows.map((r) => {
      const roubo = Number(r.roubo_probability);
      const furto = Number(r.furto_probability);
      const intensity = Math.max(roubo, furto);
      return {
        type: "Feature",
        geometry: { type: "Point", coordinates: [Number(r.lng), Number(r.lat)] },
        properties: {
          id: r.id,
          name: r.name,
          neighborhood: r.neighborhood,
          intensity,
          roubo_probability: roubo,
          furto_probability: furto,
        },
      };
    });

    return {
      type: "FeatureCollection",
      features,
      meta: { city: citySlug, day, turno, methodology: METHODOLOGY },
    };
  });

  app.get("/api/hotspots/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const query = req.query as Record<string, unknown>;
    let day: number, turno: string;
    try {
      ({ day, turno } = parseDayTurno(query));
    } catch (e: any) {
      return reply.code(e.statusCode).send({ error: e.message });
    }

    const { rows } = await pool.query(
      `SELECT h.id, h.name, h.neighborhood, h.lat, h.lng,
              MAX(CASE WHEN ip.crime_type = 'roubo' THEN ip.probability END) AS roubo_probability,
              MAX(CASE WHEN ip.crime_type = 'furto' THEN ip.probability END) AS furto_probability
         FROM hotspots h
         JOIN incident_patterns ip ON ip.hotspot_id = h.id AND ip.day_of_week = $2 AND ip.turno = $3
        WHERE h.id = $1
        GROUP BY h.id, h.name, h.neighborhood, h.lat, h.lng`,
      [id, day, turno]
    );

    if (rows.length === 0) return reply.code(404).send({ error: "hotspot não encontrado" });

    const r = rows[0];
    const roubo = Number(r.roubo_probability);
    const furto = Number(r.furto_probability);
    return {
      id: r.id,
      name: r.name,
      neighborhood: r.neighborhood,
      lat: Number(r.lat),
      lng: Number(r.lng),
      day,
      turno,
      intensity: Math.max(roubo, furto),
      roubo_probability: roubo,
      furto_probability: furto,
      methodology: METHODOLOGY,
    };
  });
}
