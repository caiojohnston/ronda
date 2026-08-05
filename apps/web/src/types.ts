export type Turno = "madrugada" | "manha" | "tarde" | "noite";

export interface City {
  slug: string;
  name: string;
  state: string;
  center_lat: number;
  center_lng: number;
  default_zoom: number;
  has_temporal_data: boolean;
}

export interface HotspotProperties {
  id: number;
  name: string;
  neighborhood: string;
  intensity: number;
  roubo_probability: number;
  furto_probability: number;
}

export interface HotspotFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: HotspotProperties;
}

export interface HotspotCollection {
  type: "FeatureCollection";
  features: HotspotFeature[];
  meta: { city: string; day: number; turno: Turno; methodology: string; temporal_data: boolean };
}

export interface HotspotDetail extends HotspotProperties {
  lat: number;
  lng: number;
  day: number;
  turno: Turno;
  methodology: string;
  temporal_data: boolean;
}

export interface ArmedViolenceProperties {
  id: number;
  occurred_at: string;
  neighborhood: string | null;
  address: string | null;
  main_reason: string | null;
  victim_count: number;
  death_count: number;
}

export interface ArmedViolenceFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: ArmedViolenceProperties;
}

export interface ArmedViolenceCollection {
  type: "FeatureCollection";
  features: ArmedViolenceFeature[];
  meta: { city: string; window_days: number; methodology: string; source: string };
}

export interface CrimeOccurrenceProperties {
  id: number;
  crime_type: "roubo" | "furto";
  bairro: string;
  occurred_at: string;
}

export interface CrimeOccurrenceFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: CrimeOccurrenceProperties;
}

export interface CrimeOccurrenceCollection {
  type: "FeatureCollection";
  features: CrimeOccurrenceFeature[];
  meta: { city: string; count: number; methodology: string; source: string };
}

export interface CrimeOccurrenceFilters {
  from?: string;
  to?: string;
  dayOfWeek?: number;
  turno?: Turno;
  crimeType?: "roubo" | "furto";
  bairro?: string;
}
