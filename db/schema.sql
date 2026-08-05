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

-- Eventos pontuais de violência armada (tiroteios), fonte: Instituto Fogo Cruzado.
-- Fenômeno diferente de roubo/furto (incident_patterns) — não é probabilidade agregada,
-- é ocorrência individual real, por isso tabela própria em vez de reaproveitar
-- incident_patterns. Ver specs/methodology.md.
CREATE TABLE IF NOT EXISTS armed_violence_events (
  id SERIAL PRIMARY KEY,
  city_id INT NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  external_id UUID UNIQUE NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  neighborhood TEXT,
  address TEXT,
  main_reason TEXT,
  victim_count INT NOT NULL DEFAULT 0,
  death_count INT NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'fogo_cruzado'
);

CREATE INDEX IF NOT EXISTS armed_violence_events_city_idx ON armed_violence_events (city_id, occurred_at);

-- Ocorrências individuais reais de roubo/furto, fonte: CODEC (codec.segup.pa.gov.br),
-- exportação manual pelo usuário em 2026-08-05 (jan/2025 a ago/2026, já filtrado
-- roubo+furto). Ponto bruto por ocorrência, usado na camada de clustering do mapa —
-- separado de incident_patterns, que é o índice agregado (probabilidade), gerado a
-- partir deste mesmo dado em db/seed.js. Sem microdado de vítima/autor: a fonte tem
-- colunas de sexo/idade/cor/escolaridade, deliberadamente não importadas aqui.
CREATE TABLE IF NOT EXISTS crime_occurrences (
  id SERIAL PRIMARY KEY,
  city_id INT NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  crime_type TEXT NOT NULL CHECK (crime_type IN ('roubo','furto')),
  bairro TEXT NOT NULL,
  occurred_at TIMESTAMP NOT NULL,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  turno TEXT NOT NULL CHECK (turno IN ('madrugada','manha','tarde','noite')),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  source TEXT NOT NULL DEFAULT 'codec_segup_pa'
);

CREATE INDEX IF NOT EXISTS crime_occurrences_city_idx ON crime_occurrences (city_id);
