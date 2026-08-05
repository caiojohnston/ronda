CREATE TABLE IF NOT EXISTS cities (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  center_lat DOUBLE PRECISION NOT NULL,
  center_lng DOUBLE PRECISION NOT NULL,
  default_zoom INT NOT NULL DEFAULT 12
);

-- false quando a fonte de dado da cidade não tem granularidade de turno/dia-da-semana
-- (caso do ISP-RJ, que só publica agregado mensal por delegacia) — controla se a UI
-- oferece o seletor de dia/turno ou mostra risco fixo anual.
ALTER TABLE cities ADD COLUMN IF NOT EXISTS has_temporal_data BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS hotspots (
  id SERIAL PRIMARY KEY,
  city_id INT NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  base_weight NUMERIC NOT NULL DEFAULT 1.0
);

CREATE INDEX IF NOT EXISTS hotspots_city_idx ON hotspots (city_id);

CREATE TABLE IF NOT EXISTS incident_patterns (
  id SERIAL PRIMARY KEY,
  hotspot_id INT NOT NULL REFERENCES hotspots(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  turno TEXT NOT NULL CHECK (turno IN ('madrugada','manha','tarde','noite')),
  crime_type TEXT NOT NULL CHECK (crime_type IN ('roubo','furto')),
  probability NUMERIC(4,3) NOT NULL CHECK (probability BETWEEN 0 AND 1),
  UNIQUE (hotspot_id, day_of_week, turno, crime_type)
);

CREATE INDEX IF NOT EXISTS incident_patterns_lookup_idx ON incident_patterns (hotspot_id, day_of_week, turno);
