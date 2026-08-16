import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type {
  ArmedViolenceFeature,
  City,
  CrimeOccurrenceFilters,
  CrimeOccurrenceProperties,
  HotspotFeature,
  Turno,
} from "../types";
import { fetchArmedViolence, fetchCrimeOccurrences, fetchHotspots } from "../lib/api";
import { markerSize, riskColor, riskLabel } from "../lib/risk";

interface Props {
  city: City;
  day: number;
  turno: Turno;
  theme: "light" | "dark";
  showArmedViolence: boolean;
  showOccurrences: boolean;
  occurrenceFilters: CrimeOccurrenceFilters;
  selectedHotspotId: number | null;
  onSelectHotspot: (id: number) => void;
  onSelectViolenceEvent: (event: ArmedViolenceFeature) => void;
  onArmedViolenceCount: (count: number) => void;
  onSelectOccurrence: (occurrence: CrimeOccurrenceProperties) => void;
  onOccurrenceCount: (count: number) => void;
}

function styleUrlFor(theme: "light" | "dark"): string {
  return theme === "dark" ? "https://tiles.openfreemap.org/styles/dark" : "https://tiles.openfreemap.org/styles/positron";
}

const OCC_SOURCE = "occurrences";
const OCC_CLUSTER_LAYER = "occurrences-clusters";
const OCC_CLUSTER_COUNT_LAYER = "occurrences-cluster-count";
const OCC_POINT_LAYER = "occurrences-unclustered-point";
const EMPTY_FC: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

export default function MapView({
  city,
  day,
  turno,
  theme,
  showArmedViolence,
  showOccurrences,
  occurrenceFilters,
  selectedHotspotId,
  onSelectHotspot,
  onSelectViolenceEvent,
  onArmedViolenceCount,
  onSelectOccurrence,
  onOccurrenceCount,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const hotspotMarkersRef = useRef<Map<number, { marker: maplibregl.Marker; el: HTMLDivElement }>>(new Map());
  const violenceMarkersRef = useRef<maplibregl.Marker[]>([]);
  const occLayerReadyRef = useRef(false);
  const currentOccDataRef = useRef<GeoJSON.FeatureCollection>(EMPTY_FC);
  const lastThemeRef = useRef(theme);
  const selectedHotspotIdRef = useRef(selectedHotspotId);
  selectedHotspotIdRef.current = selectedHotspotId;
  const onSelectOccurrenceRef = useRef(onSelectOccurrence);
  onSelectOccurrenceRef.current = onSelectOccurrence;

  function setupOccurrenceLayers(map: maplibregl.Map) {
    map.addSource(OCC_SOURCE, {
      type: "geojson",
      data: EMPTY_FC,
      cluster: true,
      clusterMaxZoom: 15,
      clusterRadius: 50,
      generateId: true,
    });

    map.addLayer({
      id: OCC_CLUSTER_LAYER,
      type: "circle",
      source: OCC_SOURCE,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": ["step", ["get", "point_count"], "#f1c40f", 25, "#e67e22", 100, "#e74c3c", 500, "#c0392b"],
        "circle-radius": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          ["+", ["step", ["get", "point_count"], 14, 25, 18, 100, 24, 500, 30], 4],
          ["step", ["get", "point_count"], 14, 25, 18, 100, 24, 500, 30],
        ],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
        "circle-opacity": 0.9,
      },
    });

    map.addLayer({
      id: OCC_CLUSTER_COUNT_LAYER,
      type: "symbol",
      source: OCC_SOURCE,
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-size": 12,
      },
      paint: { "text-color": "#2c3e50" },
    });

    map.addLayer({
      id: OCC_POINT_LAYER,
      type: "circle",
      source: OCC_SOURCE,
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": ["match", ["get", "crime_type"], "roubo", "#e74c3c", "furto", "#e67e22", "#e74c3c"],
        "circle-radius": ["case", ["boolean", ["feature-state", "hover"], false], 7, 5],
        "circle-stroke-width": 1,
        "circle-stroke-color": "#ffffff",
      },
    });

    occLayerReadyRef.current = true;
    (map.getSource(OCC_SOURCE) as maplibregl.GeoJSONSource).setData(currentOccDataRef.current);
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrlFor(theme),
      center: [city.center_lng, city.center_lat],
      zoom: city.default_zoom,
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    map.on("click", OCC_CLUSTER_LAYER, (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [OCC_CLUSTER_LAYER] });
      const feature = features[0];
      const clusterId = feature?.properties?.cluster_id;
      if (clusterId === undefined) return;
      const source = map.getSource(OCC_SOURCE) as maplibregl.GeoJSONSource;
      source.getClusterExpansionZoom(clusterId).then((zoom) => {
        map.easeTo({ center: (feature.geometry as GeoJSON.Point).coordinates as [number, number], zoom });
      });
    });

    map.on("click", OCC_POINT_LAYER, (e) => {
      const feature = e.features?.[0];
      if (!feature) return;
      onSelectOccurrenceRef.current(feature.properties as unknown as CrimeOccurrenceProperties);
    });

    // Handlers ficam presos ao id da layer, não ao objeto layer em si — sobrevivem a um
    // setStyle()+re-addLayer() (troca de tema), por isso são registrados uma única vez aqui.
    let hoveredOccId: number | null = null;
    const hoverPopup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10 });

    for (const layer of [OCC_CLUSTER_LAYER, OCC_POINT_LAYER]) {
      map.on("mouseenter", layer, () => (map.getCanvas().style.cursor = "pointer"));

      map.on("mousemove", layer, (e) => {
        const feature = e.features?.[0];
        if (!feature || feature.id === undefined || feature.id === hoveredOccId) return;
        if (hoveredOccId !== null) map.setFeatureState({ source: OCC_SOURCE, id: hoveredOccId }, { hover: false });
        hoveredOccId = feature.id as number;
        map.setFeatureState({ source: OCC_SOURCE, id: hoveredOccId }, { hover: true });

        if (layer === OCC_POINT_LAYER) {
          const p = feature.properties as unknown as CrimeOccurrenceProperties;
          const label = p.crime_type === "roubo" ? "Roubo" : "Furto";
          const date = new Date(p.occurred_at).toLocaleDateString("pt-BR");
          hoverPopup
            .setLngLat((feature.geometry as GeoJSON.Point).coordinates as [number, number])
            .setHTML(`<strong>${label}</strong><br>${date}`)
            .addTo(map);
        } else {
          hoverPopup.remove();
        }
      });

      map.on("mouseleave", layer, () => {
        map.getCanvas().style.cursor = "";
        if (hoveredOccId !== null) map.setFeatureState({ source: OCC_SOURCE, id: hoveredOccId }, { hover: false });
        hoveredOccId = null;
        hoverPopup.remove();
      });
    }

    map.on("load", () => setupOccurrenceLayers(map));

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [city]);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.jumpTo({ center: [city.center_lng, city.center_lat], zoom: city.default_zoom });
  }, [city.slug]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || lastThemeRef.current === theme) return;
    lastThemeRef.current = theme;
    occLayerReadyRef.current = false;
    map.setStyle(styleUrlFor(theme));
    map.once("style.load", () => setupOccurrenceLayers(map));
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    fetchHotspots(city.slug, day, turno).then((collection) => {
      if (cancelled || !mapRef.current) return;
      const nextIds = new Set(collection.features.map((f) => f.properties.id));

      for (const [id, entry] of hotspotMarkersRef.current) {
        if (!nextIds.has(id)) {
          entry.marker.remove();
          hotspotMarkersRef.current.delete(id);
        }
      }

      collection.features.forEach((feature: HotspotFeature) => {
        const { id, name, intensity } = feature.properties;
        const [lng, lat] = feature.geometry.coordinates;
        const size = markerSize(intensity);
        const color = riskColor(intensity);
        const title = `${name} — Risco ${riskLabel(intensity)}`;
        const existing = hotspotMarkersRef.current.get(id);

        if (existing) {
          existing.el.title = title;
          const core = existing.el.querySelector(".core") as HTMLElement;
          core.style.width = `${size}px`;
          core.style.height = `${size}px`;
          core.style.background = color;
          core.classList.toggle("selected", id === selectedHotspotIdRef.current);
          return;
        }

        const el = document.createElement("div");
        el.className = "hotspot-marker";
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.title = title;
        el.innerHTML = `<span class="core" style="width:${size}px;height:${size}px;background:${color}"></span>`;
        if (id === selectedHotspotIdRef.current) el.querySelector(".core")?.classList.add("selected");
        el.addEventListener("click", () => onSelectHotspot(id));

        const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(mapRef.current!);
        hotspotMarkersRef.current.set(id, { marker, el });
      });
    });

    return () => {
      cancelled = true;
    };
  }, [city, day, turno, onSelectHotspot]);

  useEffect(() => {
    hotspotMarkersRef.current.forEach((entry, id) => {
      entry.el.querySelector(".core")?.classList.toggle("selected", id === selectedHotspotId);
    });
  }, [selectedHotspotId]);

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
        el.title = `${feature.properties.neighborhood ?? "Bairro não informado"} — ${feature.properties.main_reason ?? "Motivo não informado"}`;
        el.addEventListener("click", () => onSelectViolenceEvent(feature));

        return new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(mapRef.current!);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [city, showArmedViolence, onSelectViolenceEvent, onArmedViolenceCount]);

  useEffect(() => {
    let cancelled = false;

    function applyData(data: GeoJSON.FeatureCollection) {
      currentOccDataRef.current = data;
      const map = mapRef.current;
      if (map && occLayerReadyRef.current) {
        (map.getSource(OCC_SOURCE) as maplibregl.GeoJSONSource).setData(data);
      }
    }

    if (!showOccurrences) {
      applyData(EMPTY_FC);
      return;
    }

    fetchCrimeOccurrences(city.slug, occurrenceFilters).then((collection) => {
      if (cancelled) return;
      onOccurrenceCount(collection.features.length);
      applyData(collection as unknown as GeoJSON.FeatureCollection);
    });

    return () => {
      cancelled = true;
    };
  }, [city, showOccurrences, occurrenceFilters, onOccurrenceCount]);

  return <div ref={containerRef} className="absolute inset-0" />;
}
