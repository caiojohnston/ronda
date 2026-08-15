import { useCallback, useEffect, useState } from "react";
import MapView from "./components/MapView";
import TimeControl from "./components/TimeControl";
import HotspotDetail from "./components/HotspotDetail";
import ArmedViolenceDetail from "./components/ArmedViolenceDetail";
import CrimeOccurrenceDetail from "./components/CrimeOccurrenceDetail";
import { fetchCities } from "./lib/api";
import type { ArmedViolenceFeature, City, CrimeOccurrenceFilters, CrimeOccurrenceProperties, Turno } from "./types";

function turnoFromHour(hour: number): Turno {
  if (hour < 6) return "madrugada";
  if (hour < 12) return "manha";
  if (hour < 18) return "tarde";
  return "noite";
}

export default function App() {
  const [cities, setCities] = useState<City[]>([]);
  const [city, setCity] = useState<City | null>(null);
  const [day, setDay] = useState(() => new Date().getDay());
  const [turno, setTurno] = useState<Turno>(() => turnoFromHour(new Date().getHours()));
  const [autoMode, setAutoMode] = useState(true);
  const [selectedHotspotId, setSelectedHotspotId] = useState<number | null>(null);
  const [showArmedViolence, setShowArmedViolence] = useState(false);
  const [armedViolenceCount, setArmedViolenceCount] = useState<number | null>(null);
  const [selectedViolenceEvent, setSelectedViolenceEvent] = useState<ArmedViolenceFeature | null>(null);
  const [showOccurrences, setShowOccurrences] = useState(false);
  const [occurrenceCount, setOccurrenceCount] = useState<number | null>(null);
  const [selectedOccurrence, setSelectedOccurrence] = useState<CrimeOccurrenceProperties | null>(null);
  const [occurrenceFilters, setOccurrenceFilters] = useState<CrimeOccurrenceFilters>({});

  useEffect(() => {
    fetchCities().then((list) => {
      setCities(list);
      setCity(list.find((c) => c.slug === "belem") ?? list[0] ?? null);
    });
  }, []);

  const onChangeCity = useCallback(
    (slug: string) => {
      const next = cities.find((c) => c.slug === slug);
      if (next) {
        setCity(next);
        setSelectedHotspotId(null);
        setSelectedViolenceEvent(null);
        setArmedViolenceCount(null);
        setSelectedOccurrence(null);
        setOccurrenceCount(null);
        setOccurrenceFilters({});
      }
    },
    [cities]
  );

  useEffect(() => {
    if (!autoMode) return;
    const tick = () => {
      const now = new Date();
      setDay(now.getDay());
      setTurno(turnoFromHour(now.getHours()));
    };
    tick();
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, [autoMode]);

  const onSelectHotspot = useCallback((id: number) => {
    setSelectedHotspotId(id);
    setSelectedViolenceEvent(null);
    setSelectedOccurrence(null);
  }, []);

  const onSelectViolenceEvent = useCallback((event: ArmedViolenceFeature) => {
    setSelectedViolenceEvent(event);
    setSelectedHotspotId(null);
    setSelectedOccurrence(null);
  }, []);

  const onSelectOccurrence = useCallback((occurrence: CrimeOccurrenceProperties) => {
    setSelectedOccurrence(occurrence);
    setSelectedHotspotId(null);
    setSelectedViolenceEvent(null);
  }, []);

  const onToggleArmedViolence = useCallback(() => {
    setShowArmedViolence((v) => !v);
    setArmedViolenceCount(null);
  }, []);

  const onToggleOccurrences = useCallback(() => {
    setShowOccurrences((v) => !v);
    setOccurrenceCount(null);
  }, []);

  const onChangeOccurrenceFilters = useCallback((patch: Partial<CrimeOccurrenceFilters>) => {
    setOccurrenceFilters((prev) => ({ ...prev, ...patch }));
    setOccurrenceCount(null);
  }, []);

  if (!city) {
    return <div className="h-full w-full flex items-center justify-center text-[#7f8c8d]">Carregando Ronda…</div>;
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapView
        city={city}
        day={day}
        turno={turno}
        showArmedViolence={showArmedViolence}
        showOccurrences={showOccurrences}
        occurrenceFilters={occurrenceFilters}
        onSelectHotspot={onSelectHotspot}
        onSelectViolenceEvent={onSelectViolenceEvent}
        onArmedViolenceCount={setArmedViolenceCount}
        onSelectOccurrence={onSelectOccurrence}
        onOccurrenceCount={setOccurrenceCount}
      />
      <TimeControl
        cities={cities}
        city={city}
        day={day}
        turno={turno}
        autoMode={autoMode}
        showArmedViolence={showArmedViolence}
        armedViolenceCount={armedViolenceCount}
        showOccurrences={showOccurrences}
        occurrenceCount={occurrenceCount}
        occurrenceFilters={occurrenceFilters}
        onChangeCity={onChangeCity}
        onChangeDay={setDay}
        onChangeTurno={setTurno}
        onToggleAuto={() => setAutoMode((v) => !v)}
        onToggleArmedViolence={onToggleArmedViolence}
        onToggleOccurrences={onToggleOccurrences}
        onChangeOccurrenceFilters={onChangeOccurrenceFilters}
      />
      {selectedHotspotId !== null && (
        <HotspotDetail
          hotspotId={selectedHotspotId}
          day={day}
          turno={turno}
          onClose={() => setSelectedHotspotId(null)}
        />
      )}
      {selectedViolenceEvent !== null && (
        <ArmedViolenceDetail event={selectedViolenceEvent} onClose={() => setSelectedViolenceEvent(null)} />
      )}
      {selectedOccurrence !== null && (
        <CrimeOccurrenceDetail occurrence={selectedOccurrence} onClose={() => setSelectedOccurrence(null)} />
      )}
    </div>
  );
}
