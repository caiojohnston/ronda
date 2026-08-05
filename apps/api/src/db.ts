import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://ronda:ronda_dev@localhost:5432/ronda",
});
