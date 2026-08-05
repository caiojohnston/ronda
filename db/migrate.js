const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL || "postgres://ronda:ronda_dev@localhost:5432/ronda";

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await client.query(sql);
  console.log("migrate ok");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
