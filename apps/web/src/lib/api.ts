import type { City, HotspotCollection, HotspotDetail, Turno } from "../types";

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
