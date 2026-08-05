import type {
  ArmedViolenceCollection,
  City,
  CrimeOccurrenceCollection,
  CrimeOccurrenceFilters,
  HotspotCollection,
  HotspotDetail,
  Turno,
} from "../types";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`${path} -> HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export function fetchCities(): Promise<City[]> {
  return getJSON("/api/cities");
}

export function fetchHotspots(city: string, day: number, turno: Turno): Promise<HotspotCollection> {
  return getJSON(`/api/hotspots?city=${city}&day=${day}&turno=${turno}`);
}

export function fetchHotspotDetail(id: number, day: number, turno: Turno): Promise<HotspotDetail> {
  return getJSON(`/api/hotspots/${id}?day=${day}&turno=${turno}`);
}

export function fetchArmedViolence(city: string, days = 180): Promise<ArmedViolenceCollection> {
  return getJSON(`/api/armed-violence?city=${city}&days=${days}`);
}

export function fetchCrimeOccurrences(city: string, filters: CrimeOccurrenceFilters = {}): Promise<CrimeOccurrenceCollection> {
  const params = new URLSearchParams({ city });
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.dayOfWeek !== undefined) params.set("day_of_week", String(filters.dayOfWeek));
  if (filters.turno) params.set("turno", filters.turno);
  if (filters.crimeType) params.set("crime_type", filters.crimeType);
  if (filters.bairro) params.set("bairro", filters.bairro);
  return getJSON(`/api/crime-occurrences?${params.toString()}`);
}

export function fetchCrimeOccurrenceBairros(city: string): Promise<{ bairros: string[] }> {
  return getJSON(`/api/crime-occurrences/bairros?city=${city}`);
}
