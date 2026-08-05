import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { ArmedViolenceFeature, City, HotspotFeature, Turno } from "../types";
import { fetchArmedViolence, fetchHotspots } from "../lib/api";
import { markerSize, pulseDuration, riskColor } from "../lib/risk";

interface Props {
  city: City;
  day: number;
  turno: Turno;
  showArmedViolence: boolean;
  onSelectHotspot: (id: number) => void;
  onSelectViolenceEvent: (event: ArmedViolenceFeature) => void;
  onArmedViolenceCount: (count: number) => void;
}

const TILE_STYLE = "https://tiles.openfreemap.org/styles/positron";

export default function MapView({
  city,
  day,
  turno,
  showArmedViolence,
  onSelectHotspot,
  onSelectViolenceEvent,
  onArmedViolenceCount,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const violenceMarkersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: TILE_STYLE,
      center: [city.center_lng, city.center_lat],
      zoom: city.default_zoom,
    });
    mapRef.current.addControl(new maplibregl.NavigationControl(), "top-right");
  }, [city]);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.jumpTo({ center: [city.center_lng, city.center_lat], zoom: city.default_zoom });
  }, [city.slug]);

  useEffect(() => {
    let cancelled = false;

    fetchHotspots(city.slug, day, turno).then((collection) => {
      if (cancelled || !mapRef.current) return;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = collection.features.map((feature: HotspotFeature) => {
        const { intensity, id } = feature.properties;
        const [lng, lat] = feature.geometry.coordinates;
        const size = markerSize(intensity);
        const color = riskColor(intensity);

        const el = document.createElement("div");
        el.className = "hotspot-marker";
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.innerHTML = `
          <span class="ring" style="background:${color};animation-duration:${pulseDuration(intensity)}s"></span>
          <span class="core" style="width:${size * 0.55}px;height:${size * 0.55}px;background:${color}"></span>
        `;
        el.addEventListener("click", () => onSelectHotspot(id));

        return new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(mapRef.current!);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [city, day, turno, onSelectHotspot]);

  useEffect(() => {
    let cancelled = false;

    if (!showArmedViolence) {
      violenceMarkersRef.current.forEach((m) => m.remove());
      violenceMarkersRef.current = [];
      return;
    }

    fetchArmedViolence(city.slug).then((collection) => {
      if (cancelled || !mapRef.current) return;
      violenceMarkersRef.current.forEach((m) => m.remove());
      onArmedViolenceCount(collection.features.length);
      violenceMarkersRef.current = collection.features.map((feature: ArmedViolenceFeature) => {
        const [lng, lat] = feature.geometry.coordinates;

        const el = document.createElement("div");
        el.className = "violence-marker";
        el.addEventListener("click", () => onSelectViolenceEvent(feature));

        return new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(mapRef.current!);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [city, showArmedViolence, onSelectViolenceEvent, onArmedViolenceCount]);

  return <div ref={containerRef} className="absolute inset-0" />;
}
