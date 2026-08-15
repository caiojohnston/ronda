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
import { markerSize, riskColor } from "../lib/risk";

interface Props {
  city: City;
  day: number;
  turno: Turno;
  showArmedViolence: boolean;
  showOccurrences: boolean;
  occurrenceFilters: CrimeOccurrenceFilters;
  onSelectHotspot: (id: number) => void;
  onSelectViolenceEvent: (event: ArmedViolenceFeature) => void;
  onArmedViolenceCount: (count: number) => void;
  onSelectOccurrence: (occurrence: CrimeOccurrenceProperties) => void;
  onOccurrenceCount: (count: number) => void;
}

const TILE_STYLE = "https://tiles.openfreemap.org/styles/positron";

const OCC_SOURCE = "occurrences";
const OCC_CLUSTER_LAYER = "occurrences-clusters";
const OCC_CLUSTER_COUNT_LAYER = "occurrences-cluster-count";
const OCC_POINT_LAYER = "occurrences-unclustered-point";
const EMPTY_FC: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

export default function MapView({
  city,
  day,
  turno,
  showArmedViolence,
  showOccurrences,
  occurrenceFilters,
  onSelectHotspot,
  onSelectViolenceEvent,
  onArmedViolenceCount,
  onSelectOccurrence,
  onOccurrenceCount,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const violenceMarkersRef = useRef<maplibregl.Marker[]>([]);
  const occLayerReadyRef = useRef(false);
  const pendingOccDataRef = useRef<GeoJSON.FeatureCollection | null>(null);
  const onSelectOccurrenceRef = useRef(onSelectOccurrence);
  onSelectOccurrenceRef.current = onSelectOccurrence;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: TILE_STYLE,
      center: [city.center_lng, city.center_lat],
      zoom: city.default_zoom,
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    map.on("load", () => {
      map.addSource(OCC_SOURCE, {
        type: "geojson",
        data: EMPTY_FC,
        cluster: true,
        clusterMaxZoom: 15,
        clusterRadius: 50,
      });

      map.addLayer({
        id: OCC_CLUSTER_LAYER,
        type: "circle",
        source: OCC_SOURCE,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": ["step", ["get", "point_count"], "#f1c40f", 25, "#e67e22", 100, "#e74c3c", 500, "#c0392b"],
          "circle-radius": ["step", ["get", "point_count"], 14, 25, 18, 100, 24, 500, 30],
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
          "circle-radius": 5,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
        },
      });

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

      for (const layer of [OCC_CLUSTER_LAYER, OCC_POINT_LAYER]) {
        map.on("mouseenter", layer, () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", layer, () => (map.getCanvas().style.cursor = ""));
      }

      occLayerReadyRef.current = true;
      if (pendingOccDataRef.current) {
        (map.getSource(OCC_SOURCE) as maplibregl.GeoJSONSource).setData(pendingOccDataRef.current);
      }
    });
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
          <span class="core" style="width:${size}px;height:${size}px;background:${color}"></span>
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

  useEffect(() => {
    let cancelled = false;

    function applyData(data: GeoJSON.FeatureCollection) {
      const map = mapRef.current;
      if (!map) return;
      if (occLayerReadyRef.current) {
        (map.getSource(OCC_SOURCE) as maplibregl.GeoJSONSource).setData(data);
      } else {
        pendingOccDataRef.current = data;
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
