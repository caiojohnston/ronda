import type { FastifyInstance } from "fastify";
import { pool } from "../db.js";

export default async function citiesRoutes(app: FastifyInstance) {
  app.get("/api/cities", async () => {
    const { rows } = await pool.query(
      `SELECT slug, name, state, center_lat, center_lng, default_zoom, has_temporal_data FROM cities ORDER BY name`
    );
    return rows;
  });
}
