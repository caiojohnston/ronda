import { DAY_LABELS, TURNO_LABELS } from "../lib/risk";
import type { City, Turno } from "../types";

interface Props {
  cities: City[];
  city: City;
  day: number;
  turno: Turno;
  autoMode: boolean;
  onChangeCity: (slug: string) => void;
  onChangeDay: (day: number) => void;
  onChangeTurno: (turno: Turno) => void;
  onToggleAuto: () => void;
}

const TURNOS: Turno[] = ["madrugada", "manha", "tarde", "noite"];

export default function TimeControl({
  cities,
  city,
  day,
  turno,
  autoMode,
  onChangeCity,
  onChangeDay,
  onChangeTurno,
  onToggleAuto,
}: Props) {
  const hasTemporalData = city.has_temporal_data;
  const controlsDisabled = autoMode || !hasTemporalData;

  return (
    <div className="absolute top-4 left-4 z-10 w-80 rounded-xl bg-slate-900/90 backdrop-blur border border-slate-700 shadow-xl p-4 text-slate-100">
      <div className="flex items-center justify-between mb-3">
        <h1 className="font-bold text-lg tracking-tight">Ronda</h1>
        <button
          onClick={onToggleAuto}
          disabled={!hasTemporalData}
          className={`text-xs px-2 py-1 rounded-full border disabled:opacity-40 ${
            autoMode ? "bg-emerald-500/20 border-emerald-400 text-emerald-300" : "bg-slate-800 border-slate-600 text-slate-300"
          }`}
        >
          {autoMode ? "● Agora" : "Simulando"}
        </button>
      </div>

      {cities.length > 1 && (
        <select
          value={city.slug}
          onChange={(e) => onChangeCity(e.target.value)}
          className="w-full mb-3 text-xs bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-slate-200"
        >
          {cities.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name} · {c.state}
            </option>
          ))}
        </select>
      )}

      <div className="grid grid-cols-7 gap-1 mb-3">
        {DAY_LABELS.map((label, idx) => (
          <button
            key={label}
            onClick={() => onChangeDay(idx)}
            disabled={controlsDisabled}
            title={label}
            className={`text-[10px] py-1 rounded ${
              day === idx ? "bg-red-500 text-white" : "bg-slate-800 text-slate-400"
            } disabled:opacity-40`}
          >
            {label.slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1">
        {TURNOS.map((t) => (
          <button
            key={t}
            onClick={() => onChangeTurno(t)}
            disabled={controlsDisabled}
            className={`text-xs py-1.5 rounded ${
              turno === t ? "bg-red-500 text-white" : "bg-slate-800 text-slate-400"
            } disabled:opacity-40`}
          >
            {TURNO_LABELS[t].split(" · ")[0]}
          </button>
        ))}
      </div>

      {hasTemporalData ? (
        <p className="text-[11px] text-slate-400 mt-3 leading-snug">
          Índice de risco histórico por local — não é ocorrência em tempo real.
        </p>
      ) : (
        <p className="text-[11px] text-amber-400/90 mt-3 leading-snug">
          {city.name}: fonte oficial não publica dado por turno/dia da semana. Índice fixo,
          baseado no total de ocorrências de 2025 por delegacia.
        </p>
      )}
    </div>
  );
}
