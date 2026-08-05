import Fastify from "fastify";
import cors from "@fastify/cors";
import citiesRoutes from "./routes/cities.js";
import hotspotsRoutes from "./routes/hotspots.js";
import armedViolenceRoutes from "./routes/armed-violence.js";
import crimeOccurrencesRoutes from "./routes/crime-occurrences.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.CORS_ORIGIN || /^http:\/\/localhost:\d+$/,
});
await app.register(citiesRoutes);
await app.register(hotspotsRoutes);
await app.register(armedViolenceRoutes);
await app.register(crimeOccurrencesRoutes);

app.get("/health", async () => ({ ok: true }));

const port = Number(process.env.PORT) || 4000;
app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
