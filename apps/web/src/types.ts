export type Turno = "madrugada" | "manha" | "tarde" | "noite";

export interface City {
  slug: string;
  name: string;
  state: string;
  center_lat: number;
  center_lng: number;
  default_zoom: number;
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
  meta: { city: string; day: number; turno: Turno; methodology: string };
}

export interface HotspotDetail extends HotspotProperties {
  lat: number;
  lng: number;
  day: number;
  turno: Turno;
  methodology: string;
}
