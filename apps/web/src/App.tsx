import { useCallback, useEffect, useState } from "react";
import MapView from "./components/MapView";
import TimeControl from "./components/TimeControl";
import HotspotDetail from "./components/HotspotDetail";
import { fetchCities } from "./lib/api";
import type { City, Turno } from "./types";

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

  const onSelectHotspot = useCallback((id: number) => setSelectedHotspotId(id), []);

  if (!city) {
    return <div className="h-full w-full flex items-center justify-center text-slate-400">Carregando Ronda…</div>;
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapView city={city} day={day} turno={turno} onSelectHotspot={onSelectHotspot} />
      <TimeControl
        cities={cities}
        city={city}
        day={day}
        turno={turno}
        autoMode={autoMode}
        onChangeCity={onChangeCity}
        onChangeDay={setDay}
        onChangeTurno={setTurno}
        onToggleAuto={() => setAutoMode((v) => !v)}
      />
      {selectedHotspotId !== null && (
        <HotspotDetail
          hotspotId={selectedHotspotId}
          day={day}
          turno={turno}
          onClose={() => setSelectedHotspotId(null)}
        />
      )}
    </div>
  );
}
