import type { FastifyInstance } from "fastify";
import { pool } from "../db.js";

const METHODOLOGY =
  "Ocorrências reais de violência armada (tiroteios), não roubo/furto — dado do Instituto Fogo Cruzado (fogocruzado.org.br), maior banco aberto de violência armada da América Latina. Cada ponto é um evento específico já ocorrido, não uma estimativa de risco. Mostra só os últimos meses por padrão para manter o mapa legível.";

const DEFAULT_WINDOW_DAYS = 180;

export default async function armedViolenceRoutes(app: FastifyInstance) {
  app.get("/api/armed-violence", async (req) => {
    const query = req.query as Record<string, unknown>;
    const citySlug = typeof query.city === "string" ? query.city : "belem";
    const days = Number(query.days) > 0 ? Number(query.days) : DEFAULT_WINDOW_DAYS;

    const { rows } = await pool.query(
      `SELECT e.id, e.occurred_at, e.lat, e.lng, e.neighborhood, e.address,
              e.main_reason, e.victim_count, e.death_count
         FROM armed_violence_events e
         JOIN cities c ON c.id = e.city_id
        WHERE c.slug = $1 AND e.occurred_at > now() - ($2 || ' days')::interval
        ORDER BY e.occurred_at DESC`,
      [citySlug, days]
    );

    const features = rows.map((r) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [Number(r.lng), Number(r.lat)] },
      properties: {
        id: r.id,
        occurred_at: r.occurred_at,
        neighborhood: r.neighborhood,
        address: r.address,
        main_reason: r.main_reason,
        victim_count: r.victim_count,
        death_count: r.death_count,
      },
    }));

    return {
      type: "FeatureCollection",
      features,
      meta: {
        city: citySlug,
        window_days: days,
        methodology: METHODOLOGY,
        source: "Instituto Fogo Cruzado — fogocruzado.org.br",
      },
    };
  });
}
